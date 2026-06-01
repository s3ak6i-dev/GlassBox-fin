import asyncio
import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from jose import JWTError, jwt
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user
from app.backend.config import settings
from app.backend.db import AsyncSessionLocal, get_db
from app.backend.events import bus
from app.backend.models.fleet import Agent
from app.backend.models.org import User, Workspace
from app.backend.models.trace import StoredStep, StoredTrace
from app.backend.models.violation import StoredViolation
from app.backend.schemas.trace import (
    StepResponse,
    TraceDetailResponse,
    TraceListItem,
    ViolationResponse,
)

router = APIRouter(prefix="/api/traces", tags=["traces"])


# ── helpers ──────────────────────────────────────────────────────────────────

def _outcome(t: StoredTrace) -> str:
    if t.halted:
        return "halted"
    if t.session_end is None:
        return "running"
    return "completed"


def _verify_chain_links(steps: list[StoredStep]) -> bool:
    """Structural integrity: each step's prev_hash links to the prior step_hash."""
    prev = None
    for s in steps:
        if s.prev_hash != prev:
            return False
        prev = s.step_hash
    return True


async def _workspace_agent_ids(workspace_id: str, db: AsyncSession) -> list:
    res = await db.execute(select(Agent.id).where(Agent.workspace_id == workspace_id))
    return [r[0] for r in res.all()]


async def _assert_workspace(workspace_id: str, user: User, db: AsyncSession) -> None:
    res = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.org_id == user.org_id)
    )
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Workspace not found")


# ── GET /api/traces ──────────────────────────────────────────────────────────

@router.get("", response_model=list[TraceListItem])
async def list_traces(
    workspace_id: str,
    agent_id: Optional[str] = None,
    severity: Optional[str] = None,
    outcome: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_workspace(workspace_id, user, db)
    agent_ids = await _workspace_agent_ids(workspace_id, db)
    if not agent_ids:
        return []

    q = select(StoredTrace, Agent.name).join(Agent, Agent.id == StoredTrace.agent_id).where(
        StoredTrace.agent_id.in_(agent_ids)
    )
    if agent_id:
        q = q.where(StoredTrace.agent_id == agent_id)
    q = q.order_by(StoredTrace.session_start.desc()).limit(limit).offset(offset)

    rows = (await db.execute(q)).all()
    traces = [(r[0], r[1]) for r in rows]
    trace_ids = [t.id for t, _ in traces]

    # Violation counts grouped by trace
    counts: dict = {}
    if trace_ids:
        cq = select(
            StoredViolation.trace_db_id,
            func.count(StoredViolation.id),
            func.count(StoredViolation.id).filter(StoredViolation.severity == "CRITICAL"),
        ).where(StoredViolation.trace_db_id.in_(trace_ids)).group_by(StoredViolation.trace_db_id)
        for tid, total, crit in (await db.execute(cq)).all():
            counts[tid] = (total, crit)

    items = []
    for t, agent_name in traces:
        total, crit = counts.get(t.id, (0, 0))
        oc = _outcome(t)
        if outcome and oc != outcome:
            continue
        if severity == "critical" and crit == 0:
            continue
        items.append(TraceListItem(
            id=str(t.id), trace_id=t.trace_id, agent_id=str(t.agent_id),
            agent_name=agent_name, task_description=t.task_description,
            jurisdiction=t.jurisdiction, session_start=t.session_start,
            session_end=t.session_end, step_count=t.step_count,
            violation_count=total, critical_count=crit, halted=t.halted, outcome=oc,
        ))
    return items


# ── GET /api/traces/stream (SSE) ─────────────────────────────────────────────
# Declared before /{trace_id} so it isn't captured as a path param.

@router.get("/stream")
async def stream_traces(
    workspace_id: str,
    token: str = Query(...),
):
    # EventSource can't set headers — authenticate via query token
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    async with AsyncSessionLocal() as db:
        u = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not u:
            raise HTTPException(status_code=401, detail="Invalid token")
        ws = (await db.execute(
            select(Workspace).where(Workspace.id == workspace_id, Workspace.org_id == u.org_id)
        )).scalar_one_or_none()
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found")

    async def event_gen():
        q = bus.subscribe(workspace_id)
        try:
            yield ": connected\n\n"
            while True:
                try:
                    event = await asyncio.wait_for(q.get(), timeout=20.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"  # comment line keeps the connection warm
        finally:
            bus.unsubscribe(workspace_id, q)

    return StreamingResponse(event_gen(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    })


# ── GET /api/traces/{trace_id} ───────────────────────────────────────────────

@router.get("/{trace_id}", response_model=TraceDetailResponse)
async def get_trace(
    trace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(StoredTrace, Agent.name)
        .join(Agent, Agent.id == StoredTrace.agent_id)
        .where(StoredTrace.trace_id == trace_id)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Trace not found")
    trace, agent_name = row[0], row[1]
    await _assert_workspace_for_agent(trace.agent_id, user, db)

    steps = (await db.execute(
        select(StoredStep).where(StoredStep.trace_db_id == trace.id).order_by(StoredStep.timestamp)
    )).scalars().all()
    violations = (await db.execute(
        select(StoredViolation).where(StoredViolation.trace_db_id == trace.id)
    )).scalars().all()

    by_sev = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for v in violations:
        by_sev[v.severity] = by_sev.get(v.severity, 0) + 1

    return TraceDetailResponse(
        id=str(trace.id), trace_id=trace.trace_id, agent_id=str(trace.agent_id),
        agent_name=agent_name, task_description=trace.task_description,
        jurisdiction=trace.jurisdiction, session_start=trace.session_start,
        session_end=trace.session_end, halted=trace.halted, halt_reason=trace.halt_reason,
        step_count=trace.step_count, chain_valid=_verify_chain_links(steps),
        by_severity=by_sev,
        steps=[StepResponse.model_validate(s) for s in steps],
        violations=[ViolationResponse.model_validate(v) for v in violations],
    )


@router.get("/{trace_id}/steps", response_model=list[StepResponse])
async def get_trace_steps(
    trace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(StoredTrace).where(StoredTrace.trace_id == trace_id))
    trace = res.scalar_one_or_none()
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    await _assert_workspace_for_agent(trace.agent_id, user, db)
    steps = (await db.execute(
        select(StoredStep).where(StoredStep.trace_db_id == trace.id).order_by(StoredStep.timestamp)
    )).scalars().all()
    return [StepResponse.model_validate(s) for s in steps]


async def _assert_workspace_for_agent(agent_id, user: User, db: AsyncSession) -> None:
    res = await db.execute(
        select(Workspace.id)
        .join(Agent, Agent.workspace_id == Workspace.id)
        .where(Agent.id == agent_id, Workspace.org_id == user.org_id)
    )
    if not res.first():
        raise HTTPException(status_code=403, detail="Access denied")

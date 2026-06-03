import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.db import get_db
from app.backend.events import bus
from app.backend.models.fleet import Agent
from app.backend.models.spend import SpendRecord
from app.backend.models.trace import StoredStep, StoredTrace
from app.backend.models.violation import Hold, StoredViolation
from app.backend.schemas.ingest import (
    HoldCreateIngest,
    HoldStatusResponse,
    StepIngest,
    TraceEndIngest,
    TraceStartIngest,
)
from app.backend.services.spend import detect_vendor, estimate_cost

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


async def _get_agent(key: str, db: AsyncSession) -> Agent:
    result = await db.execute(select(Agent).where(Agent.instrumentation_key == key))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=401, detail="Invalid instrumentation key")
    agent.last_seen_at = datetime.now(timezone.utc)
    return agent


async def _get_agent_dep(
    x_glassbox_key: str = Header(..., alias="X-Glassbox-Key"),
    db: AsyncSession = Depends(get_db),
) -> Agent:
    return await _get_agent(x_glassbox_key, db)


def _sha256(text: str | None) -> str | None:
    if text is None:
        return None
    return hashlib.sha256(text.encode()).hexdigest()


def _make_step(trace_db_id: uuid.UUID, body: StepIngest) -> StoredStep:
    return StoredStep(
        trace_db_id=trace_db_id,
        step_id=body.step_id,
        timestamp=body.timestamp,
        step_type=body.step_type,
        model=body.model,
        tool_name=body.tool_name,
        prompt=body.prompt,
        output=body.output,
        prompt_hash=_sha256(body.prompt),
        output_hash=_sha256(body.output),
        tool_arguments=body.tool_arguments,
        token_count=body.token_count,
        latency_ms=body.latency_ms,
        step_hash=body.step_hash,
        prev_hash=body.prev_hash,
        metadata_=body.metadata,
    )


# ── POST /api/ingest/trace/start ─────────────────────────────────────────────

@router.post("/trace/start", status_code=201)
async def trace_start(
    body: TraceStartIngest,
    agent: Agent = Depends(_get_agent_dep),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(StoredTrace).where(StoredTrace.trace_id == body.trace_id))
    if existing.scalar_one_or_none():
        return {"ok": True, "trace_id": body.trace_id}

    trace = StoredTrace(
        agent_id=agent.id,
        trace_id=body.trace_id,
        session_start=body.session_start,
        task_description=body.task_description,
        jurisdiction=body.jurisdiction,
    )
    db.add(trace)
    await db.commit()
    bus.publish(str(agent.workspace_id), {
        "type": "trace_start",
        "trace_id": body.trace_id,
        "agent_id": str(agent.id),
        "agent_name": agent.name,
        "task_description": body.task_description,
    })
    return {"ok": True, "trace_id": body.trace_id}


# ── POST /api/ingest/trace/{trace_id}/step ───────────────────────────────────

@router.post("/trace/{trace_id}/step", status_code=201)
async def trace_step(
    trace_id: str,
    body: StepIngest,
    agent: Agent = Depends(_get_agent_dep),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StoredTrace).where(StoredTrace.trace_id == trace_id, StoredTrace.agent_id == agent.id)
    )
    trace = result.scalar_one_or_none()
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")

    # Idempotent — skip if step already exists
    existing = await db.execute(
        select(StoredStep).where(StoredStep.trace_db_id == trace.id, StoredStep.step_id == body.step_id)
    )
    if existing.scalar_one_or_none():
        return {"ok": True}

    step = _make_step(trace.id, body)
    db.add(step)

    # Record spend if this step has token data
    if body.token_count and body.model:
        vendor = detect_vendor(body.model)
        input_t = body.token_count // 2
        output_t = body.token_count - input_t
        cost = estimate_cost(body.model, input_t, output_t)
        db.add(SpendRecord(
            trace_db_id=trace.id,
            agent_id=agent.id,
            vendor=vendor,
            model=body.model,
            input_tokens=input_t,
            output_tokens=output_t,
            estimated_cost_usd=cost,
        ))

    await db.commit()
    return {"ok": True}


# ── POST /api/ingest/trace/{trace_id}/end ────────────────────────────────────

@router.post("/trace/{trace_id}/end", status_code=200)
async def trace_end(
    trace_id: str,
    body: TraceEndIngest,
    agent: Agent = Depends(_get_agent_dep),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StoredTrace).where(StoredTrace.trace_id == trace_id, StoredTrace.agent_id == agent.id)
    )
    trace = result.scalar_one_or_none()
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")

    trace.session_end = body.session_end
    trace.halted = body.halted
    trace.halt_reason = body.halt_reason
    trace.step_count = body.step_count
    trace.metadata_ = body.metadata
    crit = sum(1 for v in body.violations if v.severity == "CRITICAL")

    # Create violations (skip ones already created via hold endpoint)
    for v in body.violations:
        existing = await db.execute(
            select(StoredViolation).where(StoredViolation.violation_id == v.violation_id)
        )
        if existing.scalar_one_or_none():
            continue

        # Find or create the step record
        step_result = await db.execute(
            select(StoredStep).where(StoredStep.trace_db_id == trace.id, StoredStep.step_id == v.step_id)
        )
        step_row = step_result.scalar_one_or_none()

        sv = StoredViolation(
            trace_db_id=trace.id,
            agent_id=agent.id,
            violation_id=v.violation_id,
            rule_id=v.rule_id,
            severity=v.severity,
            step_db_id=step_row.id if step_row else None,
            message=v.message,
            regulatory_reference=v.regulatory_reference,
            remediation=v.remediation,
            detected_at=v.detected_at,
            resolution=v.resolution,
            approval_latency_ms=v.approval_latency_ms,
        )
        db.add(sv)

    await db.commit()
    bus.publish(str(agent.workspace_id), {
        "type": "trace_end",
        "trace_id": trace_id,
        "agent_id": str(agent.id),
        "agent_name": agent.name,
        "step_count": body.step_count,
        "violation_count": len(body.violations),
        "critical_count": crit,
        "halted": body.halted,
        "outcome": "halted" if body.halted else "completed",
    })
    return {"ok": True, "trace_id": trace_id}


# ── POST /api/ingest/hold ─────────────────────────────────────────────────────

@router.post("/hold", status_code=201)
async def create_hold(
    body: HoldCreateIngest,
    agent: Agent = Depends(_get_agent_dep),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StoredTrace).where(StoredTrace.trace_id == body.trace_id, StoredTrace.agent_id == agent.id)
    )
    trace = result.scalar_one_or_none()
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")

    # Ensure step exists
    step_result = await db.execute(
        select(StoredStep).where(
            StoredStep.trace_db_id == trace.id,
            StoredStep.step_id == body.step.step_id
        )
    )
    step_row = step_result.scalar_one_or_none()
    if not step_row:
        step_row = _make_step(trace.id, body.step)
        db.add(step_row)
        await db.flush()

    # Create violation
    v = body.violation
    sv = StoredViolation(
        trace_db_id=trace.id,
        agent_id=agent.id,
        violation_id=v.violation_id,
        rule_id=v.rule_id,
        severity=v.severity,
        step_db_id=step_row.id,
        message=v.message,
        regulatory_reference=v.regulatory_reference,
        remediation=v.remediation,
        detected_at=v.detected_at,
        resolution="pending",
    )
    db.add(sv)
    await db.flush()

    # Create hold
    hold = Hold(
        violation_db_id=sv.id,
        agent_id=agent.id,
        workspace_id=agent.workspace_id,
        status="pending",
    )
    db.add(hold)
    await db.commit()
    await db.refresh(hold)

    bus.publish(str(agent.workspace_id), {
        "type": "hold_created",
        "hold_id": str(hold.id),
        "agent_id": str(agent.id),
        "agent_name": agent.name,
        "rule_id": v.rule_id,
        "severity": v.severity,
        "message": v.message,
    })
    return {"hold_id": str(hold.id)}


# ── POST /api/ingest/subagent ────────────────────────────────────────────────
# A parent agent registers (or reuses) a child agent and records the call edge.

@router.post("/subagent", status_code=201)
async def spawn_subagent(
    body: dict,
    x_glassbox_key: str = Header(..., alias="X-Glassbox-Key"),
    db: AsyncSession = Depends(get_db),
):
    parent = await _get_agent(x_glassbox_key, db)
    name = body.get("name")
    if not name:
        raise HTTPException(status_code=422, detail="name required")

    # reuse an existing child of this parent with the same name, else create
    existing = await db.execute(
        select(Agent).where(
            Agent.workspace_id == parent.workspace_id,
            Agent.name == name,
            Agent.parent_agent_id == parent.id,
        )
    )
    child = existing.scalar_one_or_none()
    if not child:
        child = Agent(
            workspace_id=parent.workspace_id,
            fleet_id=parent.fleet_id,
            name=name,
            description=f"Sub-agent of {parent.name}",
            parent_agent_id=parent.id,
        )
        db.add(child)
    await db.commit()
    await db.refresh(child)
    return {"instrumentation_key": str(child.instrumentation_key), "agent_id": str(child.id)}


# ── GET /api/ingest/ping ─────────────────────────────────────────────────────
# Lets the CLI validate an instrumentation key without side effects.

@router.get("/ping")
async def ping(agent: Agent = Depends(_get_agent_dep)):
    return {
        "ok": True,
        "agent": agent.name,
        "agent_id": str(agent.id),
        "workspace_id": str(agent.workspace_id),
    }


# ── GET /api/ingest/hold/{hold_id} ───────────────────────────────────────────

@router.get("/hold/{hold_id}", response_model=HoldStatusResponse)
async def get_hold_status(
    hold_id: str,
    x_glassbox_key: str = Header(..., alias="X-Glassbox-Key"),
    db: AsyncSession = Depends(get_db),
):
    await _get_agent(x_glassbox_key, db)
    result = await db.execute(select(Hold).where(Hold.id == hold_id))
    hold = result.scalar_one_or_none()
    if not hold:
        raise HTTPException(status_code=404, detail="Hold not found")
    return HoldStatusResponse(hold_id=str(hold.id), status=hold.status, notes=hold.notes)

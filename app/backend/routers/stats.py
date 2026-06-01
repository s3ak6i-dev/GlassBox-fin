from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user
from app.backend.db import get_db
from app.backend.models.fleet import Agent
from app.backend.models.org import User, Workspace
from app.backend.models.spend import SpendRecord
from app.backend.models.trace import StoredTrace
from app.backend.models.violation import Hold, StoredViolation

router = APIRouter(prefix="/api/stats", tags=["stats"])


class OverviewStats(BaseModel):
    traces_week: int
    traces_today: int
    active_violations: int
    critical_violations: int
    holds_pending: int
    spend_month: float
    agents_total: int
    traces_spark: list[int]


class AgentStat(BaseModel):
    id: str
    name: str
    fleet_id: str | None
    instrumentation_key: str
    last_seen_at: datetime | None
    trace_count: int
    violation_count: int
    critical_count: int
    status: str  # healthy | warning | critical | idle


async def _workspace(workspace_id: str, user: User, db: AsyncSession) -> Workspace:
    res = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.org_id == user.org_id)
    )
    ws = res.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ws


async def _agent_ids(workspace_id: str, db: AsyncSession) -> list:
    res = await db.execute(select(Agent.id).where(Agent.workspace_id == workspace_id))
    return [r[0] for r in res.all()]


@router.get("/overview", response_model=OverviewStats)
async def overview(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _workspace(workspace_id, user, db)
    agent_ids = await _agent_ids(workspace_id, db)
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    today = now - timedelta(days=1)
    month_ago = now - timedelta(days=30)

    if not agent_ids:
        return OverviewStats(traces_week=0, traces_today=0, active_violations=0,
                             critical_violations=0, holds_pending=0, spend_month=0.0,
                             agents_total=0, traces_spark=[0] * 24)

    traces_week = (await db.execute(
        select(func.count(StoredTrace.id)).where(
            StoredTrace.agent_id.in_(agent_ids), StoredTrace.session_start >= week_ago)
    )).scalar() or 0
    traces_today = (await db.execute(
        select(func.count(StoredTrace.id)).where(
            StoredTrace.agent_id.in_(agent_ids), StoredTrace.session_start >= today)
    )).scalar() or 0

    total_viol = (await db.execute(
        select(func.count(StoredViolation.id)).where(StoredViolation.agent_id.in_(agent_ids))
    )).scalar() or 0
    crit_viol = (await db.execute(
        select(func.count(StoredViolation.id)).where(
            StoredViolation.agent_id.in_(agent_ids), StoredViolation.severity == "CRITICAL")
    )).scalar() or 0

    holds_pending = (await db.execute(
        select(func.count(Hold.id)).where(
            Hold.workspace_id == workspace_id, Hold.status == "pending")
    )).scalar() or 0

    spend = (await db.execute(
        select(func.coalesce(func.sum(SpendRecord.estimated_cost_usd), 0)).where(
            SpendRecord.agent_id.in_(agent_ids), SpendRecord.recorded_at >= month_ago)
    )).scalar() or Decimal("0")

    # 24-hour sparkline of trace counts
    spark = [0] * 24
    rows = (await db.execute(
        select(StoredTrace.session_start).where(
            StoredTrace.agent_id.in_(agent_ids), StoredTrace.session_start >= today)
    )).all()
    for (ts,) in rows:
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        h = int((ts - today).total_seconds() // 3600)
        if 0 <= h < 24:
            spark[h] += 1

    return OverviewStats(
        traces_week=traces_week, traces_today=traces_today,
        active_violations=total_viol, critical_violations=crit_viol,
        holds_pending=holds_pending, spend_month=float(spend),
        agents_total=len(agent_ids), traces_spark=spark,
    )


@router.get("/agents", response_model=list[AgentStat])
async def agent_stats(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _workspace(workspace_id, user, db)
    agents = (await db.execute(
        select(Agent).where(Agent.workspace_id == workspace_id).order_by(Agent.created_at)
    )).scalars().all()

    now = datetime.now(timezone.utc)
    out: list[AgentStat] = []
    for a in agents:
        tc = (await db.execute(
            select(func.count(StoredTrace.id)).where(StoredTrace.agent_id == a.id)
        )).scalar() or 0
        vc = (await db.execute(
            select(func.count(StoredViolation.id)).where(StoredViolation.agent_id == a.id)
        )).scalar() or 0
        cc = (await db.execute(
            select(func.count(StoredViolation.id)).where(
                StoredViolation.agent_id == a.id, StoredViolation.severity == "CRITICAL")
        )).scalar() or 0
        pending = (await db.execute(
            select(func.count(Hold.id)).where(Hold.agent_id == a.id, Hold.status == "pending")
        )).scalar() or 0

        last = a.last_seen_at
        if last and last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        idle = last is None or (now - last) > timedelta(days=1)

        if cc > 0 or pending > 0:
            status = "critical"
        elif vc > 0:
            status = "warning"
        elif idle:
            status = "idle"
        else:
            status = "healthy"

        out.append(AgentStat(
            id=str(a.id), name=a.name, fleet_id=str(a.fleet_id) if a.fleet_id else None,
            instrumentation_key=str(a.instrumentation_key), last_seen_at=a.last_seen_at,
            trace_count=tc, violation_count=vc, critical_count=cc, status=status,
        ))
    return out

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user
from app.backend.db import get_db
from app.backend.models.fleet import Agent
from app.backend.models.org import User, Workspace
from app.backend.models.spend import SpendRecord

router = APIRouter(prefix="/api/spend", tags=["spend"])


class SpendSlice(BaseModel):
    key: str
    cost: float
    tokens: int
    calls: int


class SpendPoint(BaseModel):
    date: str
    cost: float


class SpendBreakdown(BaseModel):
    total: float
    total_tokens: int
    total_calls: int
    by_vendor: list[SpendSlice]
    by_model: list[SpendSlice]
    by_agent: list[SpendSlice]
    series: list[SpendPoint]


@router.get("/breakdown", response_model=SpendBreakdown)
async def breakdown(
    workspace_id: str,
    days: int = 30,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws = (await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.org_id == user.org_id)
    )).scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    agent_ids = [r[0] for r in (await db.execute(
        select(Agent.id).where(Agent.workspace_id == workspace_id)
    )).all()]
    if not agent_ids:
        return SpendBreakdown(total=0, total_tokens=0, total_calls=0,
                              by_vendor=[], by_model=[], by_agent=[], series=[])

    since = datetime.now(timezone.utc) - timedelta(days=days)
    base = select(SpendRecord).where(
        SpendRecord.agent_id.in_(agent_ids), SpendRecord.recorded_at >= since)
    records = (await db.execute(base)).scalars().all()

    agent_names = {
        a.id: a.name for a in (await db.execute(
            select(Agent).where(Agent.id.in_(agent_ids)))).scalars().all()
    }

    def agg(key_fn):
        acc: dict = {}
        for r in records:
            k = key_fn(r)
            s = acc.setdefault(k, {"cost": 0.0, "tokens": 0, "calls": 0})
            s["cost"] += float(r.estimated_cost_usd)
            s["tokens"] += r.input_tokens + r.output_tokens
            s["calls"] += 1
        return sorted(
            [SpendSlice(key=k, cost=round(v["cost"], 6), tokens=v["tokens"], calls=v["calls"]) for k, v in acc.items()],
            key=lambda x: x.cost, reverse=True,
        )

    # daily series
    series_acc: dict = {}
    for r in records:
        d = r.recorded_at
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        day = d.date().isoformat()
        series_acc[day] = series_acc.get(day, 0.0) + float(r.estimated_cost_usd)
    series = [SpendPoint(date=k, cost=round(v, 6)) for k, v in sorted(series_acc.items())]

    total = sum(float(r.estimated_cost_usd) for r in records)
    return SpendBreakdown(
        total=round(total, 6),
        total_tokens=sum(r.input_tokens + r.output_tokens for r in records),
        total_calls=len(records),
        by_vendor=agg(lambda r: r.vendor),
        by_model=agg(lambda r: r.model),
        by_agent=agg(lambda r: agent_names.get(r.agent_id, "unknown")),
        series=series,
    )

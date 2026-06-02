from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user
from app.backend.db import get_db
from app.backend.models.fleet import Agent, Fleet
from app.backend.models.org import User, Workspace
from app.backend.models.spend import SpendRecord, VendorConfig
from app.backend.models.trace import StoredTrace
from app.backend.models.violation import Hold, StoredViolation

router = APIRouter(prefix="/api/fleet-graph", tags=["fleet-graph"])


class GraphNode(BaseModel):
    id: str
    type: str                      # 'agent' | 'vendor'
    name: str
    fleet_id: Optional[str] = None
    status: Optional[str] = None
    trace_count: int = 0
    violation_count: int = 0
    critical_count: int = 0
    has_hold: bool = False
    spend: float = 0.0
    call_count: int = 0
    tokens: int = 0


class GraphLink(BaseModel):
    source: str
    target: str
    call_count: int
    spend: float
    has_violation: bool
    kind: str = "vendor"   # 'vendor' (agent→vendor) | 'agent' (agent→sub-agent)


class FleetInfo(BaseModel):
    id: str
    name: str
    agent_count: int


class FleetGraphResponse(BaseModel):
    nodes: list[GraphNode]
    links: list[GraphLink]
    fleets: list[FleetInfo]


@router.get("", response_model=FleetGraphResponse)
async def fleet_graph(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws = (await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.org_id == user.org_id)
    )).scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    agents = (await db.execute(
        select(Agent).where(Agent.workspace_id == workspace_id).order_by(Agent.created_at)
    )).scalars().all()
    agent_ids = [a.id for a in agents]

    fleets = (await db.execute(
        select(Fleet).where(Fleet.workspace_id == workspace_id)
    )).scalars().all()

    nodes: list[GraphNode] = []
    links: list[GraphLink] = []
    now = datetime.now(timezone.utc)

    # ── Agent nodes with stats ───────────────────────────────────────────────
    agent_crit: dict = {}
    for a in agents:
        tc = (await db.execute(select(func.count(StoredTrace.id)).where(StoredTrace.agent_id == a.id))).scalar() or 0
        vc = (await db.execute(select(func.count(StoredViolation.id)).where(StoredViolation.agent_id == a.id))).scalar() or 0
        cc = (await db.execute(select(func.count(StoredViolation.id)).where(
            StoredViolation.agent_id == a.id, StoredViolation.severity == "CRITICAL")) ).scalar() or 0
        pending = (await db.execute(select(func.count(Hold.id)).where(
            Hold.agent_id == a.id, Hold.status == "pending"))).scalar() or 0
        spend = (await db.execute(select(func.coalesce(func.sum(SpendRecord.estimated_cost_usd), 0)).where(
            SpendRecord.agent_id == a.id))).scalar() or 0
        agent_crit[str(a.id)] = cc > 0 or pending > 0

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

        nodes.append(GraphNode(
            id=str(a.id), type="agent", name=a.name,
            fleet_id=str(a.fleet_id) if a.fleet_id else None,
            status=status, trace_count=tc, violation_count=vc, critical_count=cc,
            has_hold=pending > 0, spend=float(spend),
        ))

    # ── Vendor nodes (from spend records + configured vendors) ───────────────
    vendor_totals: dict = {}   # vendor -> {count, tokens, spend}
    edge_map: dict = {}        # (agent_id, vendor) -> {count, spend}
    if agent_ids:
        rows = (await db.execute(
            select(
                SpendRecord.agent_id, SpendRecord.vendor,
                func.count(SpendRecord.id),
                func.coalesce(func.sum(SpendRecord.input_tokens + SpendRecord.output_tokens), 0),
                func.coalesce(func.sum(SpendRecord.estimated_cost_usd), 0),
            ).where(SpendRecord.agent_id.in_(agent_ids))
            .group_by(SpendRecord.agent_id, SpendRecord.vendor)
        )).all()
        for aid, vendor, cnt, toks, cost in rows:
            vt = vendor_totals.setdefault(vendor, {"count": 0, "tokens": 0, "spend": 0.0})
            vt["count"] += cnt
            vt["tokens"] += int(toks)
            vt["spend"] += float(cost)
            edge_map[(str(aid), vendor)] = {"count": cnt, "spend": float(cost)}

    # include configured-but-unused vendors as isolated nodes
    configured = (await db.execute(
        select(VendorConfig.vendor).where(VendorConfig.org_id == user.org_id)
    )).all()
    for (v,) in configured:
        vendor_totals.setdefault(v, {"count": 0, "tokens": 0, "spend": 0.0})

    for vendor, vt in vendor_totals.items():
        nodes.append(GraphNode(
            id=f"vendor:{vendor}", type="vendor", name=vendor,
            call_count=vt["count"], tokens=vt["tokens"], spend=vt["spend"],
        ))

    # ── Links agent → vendor ─────────────────────────────────────────────────
    for (aid, vendor), e in edge_map.items():
        links.append(GraphLink(
            source=aid, target=f"vendor:{vendor}",
            call_count=e["count"], spend=e["spend"],
            has_violation=agent_crit.get(aid, False),
        ))

    # ── Agent → sub-agent links (multi-agent topology) ───────────────────────
    agent_id_set = {str(a.id) for a in agents}
    for a in agents:
        if a.parent_agent_id and str(a.parent_agent_id) in agent_id_set:
            links.append(GraphLink(
                source=str(a.parent_agent_id), target=str(a.id),
                call_count=0, spend=0.0,
                has_violation=agent_crit.get(str(a.id), False),
                kind="agent",
            ))

    fleet_info = [
        FleetInfo(id=str(f.id), name=f.name,
                  agent_count=sum(1 for a in agents if a.fleet_id == f.id))
        for f in fleets
    ]

    return FleetGraphResponse(nodes=nodes, links=links, fleets=fleet_info)

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user
from app.backend.db import get_db
from app.backend.models.fleet import Agent
from app.backend.models.org import User, Workspace
from app.backend.models.trace import StoredTrace
from app.backend.models.violation import StoredViolation
from app.backend.schemas.trace import ViolationListItem

router = APIRouter(prefix="/api/violations", tags=["violations"])


@router.get("", response_model=list[ViolationListItem])
async def list_violations(
    workspace_id: str,
    severity: Optional[str] = None,
    rule_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
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
        return []

    q = (
        select(StoredViolation, Agent.name, StoredTrace.trace_id)
        .join(Agent, Agent.id == StoredViolation.agent_id)
        .join(StoredTrace, StoredTrace.id == StoredViolation.trace_db_id)
        .where(StoredViolation.agent_id.in_(agent_ids))
    )
    if severity:
        q = q.where(StoredViolation.severity == severity.upper())
    if rule_id:
        q = q.where(StoredViolation.rule_id == rule_id)
    if agent_id:
        q = q.where(StoredViolation.agent_id == agent_id)
    q = q.order_by(StoredViolation.created_at.desc()).limit(limit).offset(offset)

    rows = (await db.execute(q)).all()
    return [
        ViolationListItem(
            id=str(v.id), violation_id=v.violation_id, rule_id=v.rule_id,
            severity=v.severity, message=v.message,
            regulatory_reference=v.regulatory_reference, remediation=v.remediation,
            detected_at=v.detected_at, resolution=v.resolution,
            agent_id=str(v.agent_id), agent_name=agent_name, trace_id=trace_id,
            created_at=v.created_at,
        )
        for v, agent_name, trace_id in rows
    ]

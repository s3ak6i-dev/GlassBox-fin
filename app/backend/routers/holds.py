from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user
from app.backend.db import get_db
from app.backend.models.fleet import Agent
from app.backend.models.org import User, Workspace
from app.backend.models.violation import Hold, StoredViolation

router = APIRouter(prefix="/api/holds", tags=["holds"])


class HoldResponse(BaseModel):
    id: str
    violation_id: str
    agent_id: str
    workspace_id: str
    status: str
    rule_id: str
    severity: str
    message: str
    regulatory_reference: Optional[str]
    agent_name: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]
    notes: Optional[str]

    model_config = {"from_attributes": True}


class ResolveRequest(BaseModel):
    notes: Optional[str] = None


async def _assert_workspace_access(workspace_id: str, user: User, db: AsyncSession) -> None:
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.org_id == user.org_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")


async def _build_hold_response(hold: Hold, db: AsyncSession) -> dict:
    v_result = await db.execute(select(StoredViolation).where(StoredViolation.id == hold.violation_db_id))
    v = v_result.scalar_one_or_none()

    a_result = await db.execute(select(Agent).where(Agent.id == hold.agent_id))
    agent = a_result.scalar_one_or_none()

    return {
        "id": str(hold.id),
        "violation_id": str(hold.violation_db_id),
        "agent_id": str(hold.agent_id),
        "workspace_id": str(hold.workspace_id),
        "status": hold.status,
        "rule_id": v.rule_id if v else "unknown",
        "severity": v.severity if v else "unknown",
        "message": v.message if v else "",
        "regulatory_reference": v.regulatory_reference if v else None,
        "agent_name": agent.name if agent else None,
        "created_at": hold.created_at,
        "resolved_at": hold.resolved_at,
        "notes": hold.notes,
    }


@router.get("", response_model=list[HoldResponse])
async def list_holds(
    workspace_id: str,
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_workspace_access(workspace_id, user, db)
    q = select(Hold).where(Hold.workspace_id == workspace_id)
    if status:
        q = q.where(Hold.status == status)
    q = q.order_by(Hold.created_at.desc())
    result = await db.execute(q)
    holds = result.scalars().all()
    return [await _build_hold_response(h, db) for h in holds]


@router.get("/{hold_id}", response_model=HoldResponse)
async def get_hold(
    hold_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Hold).where(Hold.id == hold_id))
    hold = result.scalar_one_or_none()
    if not hold:
        raise HTTPException(status_code=404, detail="Hold not found")
    await _assert_workspace_access(str(hold.workspace_id), user, db)
    return await _build_hold_response(hold, db)


@router.post("/{hold_id}/approve", response_model=HoldResponse)
async def approve_hold(
    hold_id: str,
    body: ResolveRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Hold).where(Hold.id == hold_id))
    hold = result.scalar_one_or_none()
    if not hold:
        raise HTTPException(status_code=404, detail="Hold not found")
    if hold.status != "pending":
        raise HTTPException(status_code=400, detail=f"Hold is already {hold.status}")
    await _assert_workspace_access(str(hold.workspace_id), user, db)

    hold.status = "approved"
    hold.resolved_at = datetime.now(timezone.utc)
    hold.resolved_by_user_id = user.id
    hold.notes = body.notes

    # Update linked violation resolution
    v_result = await db.execute(select(StoredViolation).where(StoredViolation.id == hold.violation_db_id))
    v = v_result.scalar_one_or_none()
    if v:
        v.resolution = "approved"
        v.resolved_by_user_id = user.id
        v.approval_timestamp = hold.resolved_at

    await db.commit()
    return await _build_hold_response(hold, db)


@router.post("/{hold_id}/deny", response_model=HoldResponse)
async def deny_hold(
    hold_id: str,
    body: ResolveRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Hold).where(Hold.id == hold_id))
    hold = result.scalar_one_or_none()
    if not hold:
        raise HTTPException(status_code=404, detail="Hold not found")
    if hold.status != "pending":
        raise HTTPException(status_code=400, detail=f"Hold is already {hold.status}")
    await _assert_workspace_access(str(hold.workspace_id), user, db)

    hold.status = "denied"
    hold.resolved_at = datetime.now(timezone.utc)
    hold.resolved_by_user_id = user.id
    hold.notes = body.notes

    v_result = await db.execute(select(StoredViolation).where(StoredViolation.id == hold.violation_db_id))
    v = v_result.scalar_one_or_none()
    if v:
        v.resolution = "rejected"
        v.resolved_by_user_id = user.id
        v.approval_timestamp = hold.resolved_at

    await db.commit()
    return await _build_hold_response(hold, db)

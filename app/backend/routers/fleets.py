from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user
from app.backend.db import get_db
from app.backend.models.fleet import Fleet
from app.backend.models.org import User, Workspace
from app.backend.schemas.fleet import FleetCreate, FleetResponse, FleetUpdate

router = APIRouter(prefix="/api/fleets", tags=["fleets"])


async def _get_workspace(workspace_id: str, user: User, db: AsyncSession) -> Workspace:
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.org_id == user.org_id)
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ws


@router.get("", response_model=list[FleetResponse])
async def list_fleets(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_workspace(workspace_id, user, db)
    result = await db.execute(select(Fleet).where(Fleet.workspace_id == workspace_id))
    return result.scalars().all()


@router.post("", response_model=FleetResponse, status_code=201)
async def create_fleet(
    workspace_id: str,
    body: FleetCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_workspace(workspace_id, user, db)
    fleet = Fleet(workspace_id=workspace_id, name=body.name, description=body.description, ruleset_id=body.ruleset_id)
    db.add(fleet)
    await db.commit()
    await db.refresh(fleet)
    return fleet


@router.get("/{fleet_id}", response_model=FleetResponse)
async def get_fleet(
    fleet_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Fleet).where(Fleet.id == fleet_id))
    fleet = result.scalar_one_or_none()
    if not fleet:
        raise HTTPException(status_code=404, detail="Fleet not found")
    await _get_workspace(str(fleet.workspace_id), user, db)
    return fleet


@router.put("/{fleet_id}", response_model=FleetResponse)
async def update_fleet(
    fleet_id: str,
    body: FleetUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Fleet).where(Fleet.id == fleet_id))
    fleet = result.scalar_one_or_none()
    if not fleet:
        raise HTTPException(status_code=404, detail="Fleet not found")
    await _get_workspace(str(fleet.workspace_id), user, db)
    if body.name is not None:
        fleet.name = body.name
    if body.description is not None:
        fleet.description = body.description
    if body.ruleset_id is not None:
        fleet.ruleset_id = body.ruleset_id
    await db.commit()
    await db.refresh(fleet)
    return fleet

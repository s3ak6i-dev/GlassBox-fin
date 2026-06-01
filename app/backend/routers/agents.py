from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user
from app.backend.db import get_db
from app.backend.models.fleet import Agent
from app.backend.models.org import User, Workspace
from app.backend.schemas.fleet import AgentCreate, AgentResponse, AgentUpdate

router = APIRouter(prefix="/api/agents", tags=["agents"])


async def _assert_workspace_access(workspace_id: str, user: User, db: AsyncSession) -> None:
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.org_id == user.org_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Workspace not found")


@router.get("", response_model=list[AgentResponse])
async def list_agents(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_workspace_access(workspace_id, user, db)
    result = await db.execute(select(Agent).where(Agent.workspace_id == workspace_id))
    return result.scalars().all()


@router.post("", response_model=AgentResponse, status_code=201)
async def create_agent(
    workspace_id: str,
    body: AgentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_workspace_access(workspace_id, user, db)
    agent = Agent(
        workspace_id=workspace_id,
        fleet_id=body.fleet_id,
        name=body.name,
        description=body.description,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await _assert_workspace_access(str(agent.workspace_id), user, db)
    return agent


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    body: AgentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await _assert_workspace_access(str(agent.workspace_id), user, db)
    if body.name is not None:
        agent.name = body.name
    if body.description is not None:
        agent.description = body.description
    if body.fleet_id is not None:
        agent.fleet_id = body.fleet_id
    await db.commit()
    await db.refresh(agent)
    return agent

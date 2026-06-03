import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user, hash_password
from app.backend.db import get_db
from app.backend.models.org import Organization, User
from app.backend.schemas.auth import UserResponse
from app.backend.schemas.org import InviteRequest, InviteResponse, OrgResponse, OrgUpdate

router = APIRouter(prefix="/api/org", tags=["org"])


@router.get("", response_model=OrgResponse)
async def get_org(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Organization).where(Organization.id == user.org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.put("", response_model=OrgResponse)
async def update_org(
    body: OrgUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == user.org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    if body.name is not None:
        org.name = body.name
    if body.industry is not None:
        org.industry = body.industry
    if body.jurisdiction is not None:
        org.jurisdiction = body.jurisdiction
    if body.onboarded is not None:
        org.onboarded = body.onboarded
    await db.commit()
    await db.refresh(org)
    return org


@router.get("/members", response_model=list[UserResponse])
async def list_members(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.org_id == user.org_id))
    return result.scalars().all()


@router.post("/invite", response_model=InviteResponse, status_code=201)
async def invite_member(
    body: InviteRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Generate a strong one-time password. Returned to the admin once so they
    # can share it out-of-band; the invitee changes it from Settings on login.
    temp_password = secrets.token_urlsafe(12)
    new_user = User(
        org_id=user.org_id,
        email=body.email,
        password_hash=hash_password(temp_password),
        auth_provider="email",
        role=body.role,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return InviteResponse(
        id=str(new_user.id),
        email=new_user.email,
        role=new_user.role,
        temp_password=temp_password,
    )

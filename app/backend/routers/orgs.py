from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user, hash_password
from app.backend.db import get_db
from app.backend.models.org import Organization, User
from app.backend.schemas.auth import UserResponse
from app.backend.schemas.org import InviteRequest, OrgResponse

router = APIRouter(prefix="/api/org", tags=["org"])


@router.get("", response_model=OrgResponse)
async def get_org(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Organization).where(Organization.id == user.org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("/members", response_model=list[UserResponse])
async def list_members(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.org_id == user.org_id))
    return result.scalars().all()


@router.post("/invite", response_model=UserResponse, status_code=201)
async def invite_member(
    body: InviteRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        org_id=user.org_id,
        email=body.email,
        password_hash=hash_password("change-on-first-login"),
        role=body.role,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

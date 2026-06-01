import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import create_access_token, hash_password, verify_password
from app.backend.db import get_db
from app.backend.models.org import Organization, User, Workspace
from app.backend.schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserResponse
from app.backend.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug[:50]


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create org
    base_slug = _slugify(body.org_name)
    slug = base_slug
    counter = 1
    while True:
        taken = await db.execute(select(Organization).where(Organization.slug == slug))
        if not taken.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    org = Organization(name=body.org_name, slug=slug, jurisdiction=body.jurisdiction)
    db.add(org)
    await db.flush()

    # Default production workspace
    workspace = Workspace(org_id=org.id, name="production")
    db.add(workspace)

    # Admin user
    user = User(org_id=org.id, email=body.email, password_hash=hash_password(body.password), role="admin")
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user

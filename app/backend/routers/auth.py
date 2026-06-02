import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import create_access_token, get_current_user, hash_password, verify_password
from app.backend.config import settings
from app.backend.db import get_db
from app.backend.models.org import Organization, User, Workspace
from app.backend.schemas.auth import (
    GoogleAuthRequest,
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UpdateMeRequest,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug[:50] or "org"


async def _unique_slug(base: str, db: AsyncSession) -> str:
    slug, n = base, 1
    while True:
        taken = await db.execute(select(Organization).where(Organization.slug == slug))
        if not taken.scalar_one_or_none():
            return slug
        slug = f"{base}-{n}"
        n += 1


async def _create_org_with_user(
    db: AsyncSession, *, email: str, org_name: str, jurisdiction: str,
    password_hash: str | None, auth_provider: str, name: str | None = None,
) -> User:
    org = Organization(name=org_name, slug=await _unique_slug(_slugify(org_name), db), jurisdiction=jurisdiction)
    db.add(org)
    await db.flush()
    db.add(Workspace(org_id=org.id, name="production"))
    user = User(org_id=org.id, email=email, name=name, password_hash=password_hash,
                auth_provider=auth_provider, role="admin")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await _create_org_with_user(
        db, email=body.email, org_name=body.org_name, jurisdiction=body.jurisdiction,
        password_hash=hash_password(body.password), auth_provider="email",
    )
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/google", response_model=TokenResponse)
async def google_login(body: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(status_code=400, detail="Google sign-in is not configured")
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token
        info = google_id_token.verify_oauth2_token(
            body.credential, google_requests.Request(), settings.google_client_id
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = info.get("email")
    if not email or not info.get("email_verified", False):
        raise HTTPException(status_code=401, detail="Google account email not verified")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        # first sign-in → create their org from the email/name
        person = info.get("name")
        org_name = person or email.split("@")[0]
        user = await _create_org_with_user(
            db, email=email, org_name=org_name, jurisdiction="EU",
            password_hash=None, auth_provider="google", name=person,
        )
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserResponse)
async def update_me(
    body: UpdateMeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.name = body.name.strip() or None
    await db.commit()
    await db.refresh(user)
    return user

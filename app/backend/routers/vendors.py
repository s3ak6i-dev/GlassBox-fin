from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user
from app.backend.db import get_db
from app.backend.models.org import User
from app.backend.models.spend import VendorConfig
from app.backend.schemas.config import VendorConfigCreate, VendorConfigResponse

router = APIRouter(prefix="/api/vendors", tags=["vendors"])


@router.get("", response_model=list[VendorConfigResponse])
async def list_vendors(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VendorConfig).where(VendorConfig.org_id == user.org_id))
    return result.scalars().all()


@router.post("", response_model=VendorConfigResponse, status_code=201)
async def add_vendor(
    body: VendorConfigCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Upsert by (org, vendor)
    existing = await db.execute(
        select(VendorConfig).where(
            VendorConfig.org_id == user.org_id, VendorConfig.vendor == body.vendor
        )
    )
    vc = existing.scalar_one_or_none()
    if vc:
        vc.model_pricing = body.model_pricing
    else:
        vc = VendorConfig(org_id=user.org_id, vendor=body.vendor, model_pricing=body.model_pricing)
        db.add(vc)
    await db.commit()
    await db.refresh(vc)
    return vc

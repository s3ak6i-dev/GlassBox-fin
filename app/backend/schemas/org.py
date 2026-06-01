from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.backend.schemas.base import ORMModel


class OrgResponse(ORMModel):
    id: str
    name: str
    slug: str
    industry: str
    jurisdiction: str
    onboarded: bool
    created_at: datetime


class OrgUpdate(BaseModel):
    name: str | None = None
    industry: str | None = None
    jurisdiction: str | None = None
    onboarded: bool | None = None


class WorkspaceCreate(BaseModel):
    name: str = "production"


class WorkspaceResponse(ORMModel):
    id: str
    org_id: str
    name: str
    created_at: datetime


class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "developer"

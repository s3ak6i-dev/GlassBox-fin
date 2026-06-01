from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.backend.schemas.base import ORMModel


class OrgResponse(ORMModel):
    id: str
    name: str
    slug: str
    industry: str
    jurisdiction: str
    created_at: datetime


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

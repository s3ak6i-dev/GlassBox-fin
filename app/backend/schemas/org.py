from datetime import datetime
from pydantic import BaseModel, EmailStr


class OrgResponse(BaseModel):
    id: str
    name: str
    slug: str
    industry: str
    jurisdiction: str
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceCreate(BaseModel):
    name: str = "production"


class WorkspaceResponse(BaseModel):
    id: str
    org_id: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "developer"

from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.backend.schemas.base import ORMModel


class FleetCreate(BaseModel):
    name: str
    description: str = ""
    ruleset_id: Optional[str] = None


class FleetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    ruleset_id: Optional[str] = None


class FleetResponse(ORMModel):
    id: str
    workspace_id: str
    name: str
    description: str
    ruleset_id: Optional[str]
    created_at: datetime


class AgentCreate(BaseModel):
    name: str
    description: str = ""
    fleet_id: Optional[str] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    fleet_id: Optional[str] = None


class AgentResponse(ORMModel):
    id: str
    workspace_id: str
    fleet_id: Optional[str]
    name: str
    description: str
    instrumentation_key: str
    created_at: datetime
    last_seen_at: Optional[datetime]

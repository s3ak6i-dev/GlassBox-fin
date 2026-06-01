from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.backend.schemas.base import ORMModel


# ── Vendors ──────────────────────────────────────────────────────────────────

class VendorConfigCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    vendor: str
    model_pricing: dict = {}


class VendorConfigResponse(ORMModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    id: str
    org_id: str
    vendor: str
    model_pricing: dict


# ── Rulesets ─────────────────────────────────────────────────────────────────

class RulesetCreate(BaseModel):
    name: str
    rules_config: dict
    workspace_id: str


class RulesetResponse(ORMModel):
    id: str
    workspace_id: str
    name: str
    version: int
    rules_config: dict
    is_active: bool


# ── Rule catalogue (sourced from the glassbox library) ───────────────────────

class RuleCatalogItem(BaseModel):
    id: str
    severity: str
    trigger: str
    description: str
    regulatory_reference: Optional[str]
    remediation: Optional[str]
    default_action: str

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user
from app.backend.db import get_db
from app.backend.models.org import User, Workspace
from app.backend.models.ruleset import Ruleset
from app.backend.schemas.config import RuleCatalogItem, RulesetCreate, RulesetResponse

router = APIRouter(tags=["rulesets"])

# Default per-severity action when a ruleset is first created
_DEFAULT_ACTION = {"CRITICAL": "pause", "HIGH": "log", "MEDIUM": "log", "LOW": "log"}


@router.get("/api/rules/catalog", response_model=list[RuleCatalogItem])
async def rules_catalog(_: User = Depends(get_current_user)):
    """The 8 built-in rules, introspected directly from the glassbox library."""
    from glassbox.rules import RULE_REGISTRY

    items: list[RuleCatalogItem] = []
    for rule_id, cls in RULE_REGISTRY.items():
        sev = cls.severity.value if hasattr(cls.severity, "value") else str(cls.severity)
        trig = cls.trigger.value if hasattr(cls.trigger, "value") else str(cls.trigger)
        items.append(RuleCatalogItem(
            id=rule_id,
            severity=sev,
            trigger=trig,
            description=cls.description,
            regulatory_reference=getattr(cls, "regulatory_reference", None),
            remediation=getattr(cls, "remediation", None),
            default_action=_DEFAULT_ACTION.get(sev, "log"),
        ))
    # Order by severity weight
    order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    items.sort(key=lambda i: order.get(i.severity, 9))
    return items


async def _assert_workspace(workspace_id: str, user: User, db: AsyncSession) -> Workspace:
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.org_id == user.org_id)
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ws


@router.get("/api/rulesets", response_model=list[RulesetResponse])
async def list_rulesets(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_workspace(workspace_id, user, db)
    result = await db.execute(select(Ruleset).where(Ruleset.workspace_id == workspace_id))
    return result.scalars().all()


@router.post("/api/rulesets", response_model=RulesetResponse, status_code=201)
async def create_ruleset(
    body: RulesetCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_workspace(body.workspace_id, user, db)
    ruleset = Ruleset(
        workspace_id=body.workspace_id,
        name=body.name,
        rules_config=body.rules_config,
        is_active=True,
    )
    db.add(ruleset)
    await db.commit()
    await db.refresh(ruleset)
    return ruleset

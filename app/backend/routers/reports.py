from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.auth import get_current_user
from app.backend.db import get_db
from app.backend.models.fleet import Agent
from app.backend.models.org import Organization, User, Workspace
from app.backend.models.trace import StoredStep, StoredTrace
from app.backend.models.violation import StoredViolation
from app.backend.services.reports import period_pdf, trace_pdf

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _pdf_response(data: bytes, filename: str) -> Response:
    return Response(content=data, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/trace/{trace_id}")
async def trace_report(
    trace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(
        select(StoredTrace, Agent.workspace_id)
        .join(Agent, Agent.id == StoredTrace.agent_id)
        .where(StoredTrace.trace_id == trace_id)
    )).first()
    if not row:
        raise HTTPException(status_code=404, detail="Trace not found")
    trace, workspace_id = row[0], row[1]
    ws = (await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.org_id == user.org_id)
    )).scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=403, detail="Access denied")

    steps = (await db.execute(
        select(StoredStep).where(StoredStep.trace_db_id == trace.id).order_by(StoredStep.timestamp)
    )).scalars().all()
    viols = (await db.execute(
        select(StoredViolation).where(StoredViolation.trace_db_id == trace.id)
    )).scalars().all()

    data = trace_pdf(trace, steps, viols)
    return _pdf_response(data, f"compliance_{trace_id[:8]}.pdf")


class PeriodReportRequest(BaseModel):
    workspace_id: str
    days: int = 30


@router.post("/generate")
async def generate_report(
    body: PeriodReportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws = (await db.execute(
        select(Workspace).where(Workspace.id == body.workspace_id, Workspace.org_id == user.org_id)
    )).scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    org = (await db.execute(select(Organization).where(Organization.id == user.org_id))).scalar_one()

    agents = (await db.execute(
        select(Agent).where(Agent.workspace_id == body.workspace_id)
    )).scalars().all()
    agent_ids = [a.id for a in agents]

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=body.days)

    total_traces = 0
    halted_count = 0
    by_severity = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    agent_inv = []
    viol_list = []

    if agent_ids:
        total_traces = (await db.execute(select(func.count(StoredTrace.id)).where(
            StoredTrace.agent_id.in_(agent_ids), StoredTrace.session_start >= start))).scalar() or 0
        halted_count = (await db.execute(select(func.count(StoredTrace.id)).where(
            StoredTrace.agent_id.in_(agent_ids), StoredTrace.session_start >= start,
            StoredTrace.halted.is_(True)))).scalar() or 0

        sev_rows = (await db.execute(
            select(StoredViolation.severity, func.count(StoredViolation.id))
            .where(StoredViolation.agent_id.in_(agent_ids), StoredViolation.created_at >= start)
            .group_by(StoredViolation.severity)
        )).all()
        for sev, cnt in sev_rows:
            by_severity[sev] = cnt

        agent_names = {a.id: a.name for a in agents}
        for a in agents:
            tc = (await db.execute(select(func.count(StoredTrace.id)).where(StoredTrace.agent_id == a.id))).scalar() or 0
            vc = (await db.execute(select(func.count(StoredViolation.id)).where(StoredViolation.agent_id == a.id))).scalar() or 0
            cc = (await db.execute(select(func.count(StoredViolation.id)).where(
                StoredViolation.agent_id == a.id, StoredViolation.severity == "CRITICAL"))).scalar() or 0
            agent_inv.append({"name": a.name, "trace_count": tc, "violation_count": vc,
                              "status": "attention" if cc else ("warning" if vc else "healthy")})

        vrows = (await db.execute(
            select(StoredViolation, Agent.name)
            .join(Agent, Agent.id == StoredViolation.agent_id)
            .where(StoredViolation.agent_id.in_(agent_ids), StoredViolation.created_at >= start)
            .order_by(StoredViolation.created_at.desc())
        )).all()
        for v, aname in vrows:
            viol_list.append({"rule_id": v.rule_id, "severity": v.severity, "agent_name": aname,
                              "regulatory_reference": v.regulatory_reference, "resolution": v.resolution})

    data = period_pdf(
        org_name=org.name, workspace_name=ws.name, days=body.days, start=start, end=end,
        total_traces=total_traces, by_severity=by_severity, agents=agent_inv,
        violations=viol_list, halted_count=halted_count,
    )
    return _pdf_response(data, f"compliance_report_{end:%Y%m%d}.pdf")

from datetime import datetime
from typing import Optional

from app.backend.schemas.base import ORMModel


class StepResponse(ORMModel):
    step_id: str
    timestamp: datetime
    step_type: str
    model: Optional[str]
    tool_name: Optional[str]
    prompt: Optional[str]
    output: Optional[str]
    tool_arguments: Optional[dict]
    token_count: Optional[int]
    latency_ms: Optional[float]
    step_hash: Optional[str]
    prev_hash: Optional[str]


class ViolationResponse(ORMModel):
    id: str
    violation_id: str
    rule_id: str
    severity: str
    message: str
    regulatory_reference: Optional[str]
    remediation: Optional[str]
    detected_at: str
    resolution: Optional[str]
    step_db_id: Optional[str]


class TraceListItem(ORMModel):
    id: str
    trace_id: str
    agent_id: str
    agent_name: Optional[str]
    task_description: Optional[str]
    jurisdiction: Optional[str]
    session_start: datetime
    session_end: Optional[datetime]
    step_count: int
    violation_count: int
    critical_count: int
    halted: bool
    outcome: str  # running | completed | halted


class TraceDetailResponse(ORMModel):
    id: str
    trace_id: str
    agent_id: str
    agent_name: Optional[str]
    task_description: Optional[str]
    jurisdiction: Optional[str]
    session_start: datetime
    session_end: Optional[datetime]
    halted: bool
    halt_reason: Optional[str]
    step_count: int
    chain_valid: bool
    by_severity: dict
    steps: list[StepResponse]
    violations: list[ViolationResponse]

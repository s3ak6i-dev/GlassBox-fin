from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class StepIngest(BaseModel):
    step_id: str
    timestamp: datetime
    step_type: str
    model: Optional[str] = None
    tool_name: Optional[str] = None
    prompt: Optional[str] = None
    output: Optional[str] = None
    tool_arguments: Optional[dict] = None
    token_count: Optional[int] = None
    latency_ms: Optional[float] = None
    step_hash: Optional[str] = None
    prev_hash: Optional[str] = None
    metadata: dict = {}


class ViolationIngest(BaseModel):
    violation_id: str
    rule_id: str
    severity: str
    step_id: str
    message: str
    regulatory_reference: Optional[str] = None
    remediation: Optional[str] = None
    detected_at: str = "post_session"
    resolution: Optional[str] = None
    approval_latency_ms: Optional[float] = None


class TraceStartIngest(BaseModel):
    trace_id: str
    session_start: datetime
    task_description: Optional[str] = None
    jurisdiction: Optional[str] = None


class TraceEndIngest(BaseModel):
    session_end: datetime
    halted: bool = False
    halt_reason: Optional[str] = None
    step_count: int = 0
    violations: list[ViolationIngest] = []
    metadata: dict = {}


class HoldCreateIngest(BaseModel):
    trace_id: str
    violation: ViolationIngest
    step: StepIngest


class HoldStatusResponse(BaseModel):
    hold_id: str
    status: str
    notes: Optional[str] = None

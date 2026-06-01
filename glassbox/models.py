from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional
from uuid import uuid4


class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Trigger(str, Enum):
    PRE_CALL = "pre_call"
    POST_CALL = "post_call"
    PRE_DECISION = "pre_decision"
    POST_SESSION = "post_session"


@dataclass
class TraceStep:
    step_id: str
    timestamp: datetime
    step_type: Literal["llm_call", "tool_call", "decision"]
    model: Optional[str] = None
    prompt: Optional[str] = None
    output: Optional[str] = None
    tool_name: Optional[str] = None
    tool_arguments: Optional[dict] = None
    token_count: Optional[int] = None
    latency_ms: Optional[float] = None
    metadata: dict = field(default_factory=dict)
    step_hash: Optional[str] = None
    prev_hash: Optional[str] = None

    def __post_init__(self) -> None:
        if self.step_type not in ("llm_call", "tool_call", "decision"):
            raise ValueError(f"Invalid step_type: {self.step_type!r}")

    def compute_hash(self) -> str:
        canonical = f"{self.step_id}|{self.timestamp.isoformat()}|{self.step_type}|{self.output or ''}"
        return hashlib.sha256(canonical.encode()).hexdigest()


@dataclass
class AgentTrace:
    trace_id: str = field(default_factory=lambda: str(uuid4()))
    session_start: datetime = field(default_factory=datetime.utcnow)
    session_end: Optional[datetime] = None
    task_description: Optional[str] = None
    jurisdiction: Optional[str] = None
    steps: list[TraceStep] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)
    halted: bool = False
    halt_reason: Optional[str] = None

    def add_step(self, step: TraceStep) -> None:
        self.steps.append(step)


@dataclass
class Violation:
    violation_id: str
    rule_id: str
    severity: Severity
    step: TraceStep
    message: str
    regulatory_reference: Optional[str] = None
    remediation: Optional[str] = None
    detected_at: str = "post_session"
    resolution: Optional[str] = None
    approver_id: Optional[str] = None
    approval_timestamp: Optional[datetime] = None
    approval_latency_ms: Optional[float] = None

    @classmethod
    def from_step(cls, step: TraceStep, rule: Any) -> "Violation":
        return cls(
            violation_id=str(uuid4()),
            rule_id=rule.id,
            severity=rule.severity,
            step=step,
            message=rule.description,
            regulatory_reference=getattr(rule, "regulatory_reference", None),
            remediation=getattr(rule, "remediation", None),
        )

    def __str__(self) -> str:
        return f"[{self.severity}] {self.rule_id}: {self.message}"

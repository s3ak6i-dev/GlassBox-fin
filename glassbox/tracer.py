from __future__ import annotations

import threading
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import uuid4

from glassbox.models import AgentTrace, TraceStep, Trigger

if TYPE_CHECKING:
    from glassbox.guardrails.engine import GuardrailEngine


class TraceCollector:
    def __init__(self, trace: AgentTrace, engine: Optional["GuardrailEngine"] = None) -> None:
        self._trace = trace
        self._engine = engine
        self._lock = threading.Lock()

    def begin_step(
        self,
        step_type: str,
        **kwargs,
    ) -> TraceStep:
        step = TraceStep(
            step_id=str(uuid4()),
            timestamp=datetime.utcnow(),
            step_type=step_type,  # type: ignore[arg-type]
            **kwargs,
        )
        if self._engine:
            trigger = (
                Trigger.PRE_DECISION if step_type == "decision" else Trigger.PRE_CALL
            )
            self._engine.evaluate(step, self._trace, trigger)
        return step

    def complete_step(self, step: TraceStep, output: str, latency_ms: float) -> None:
        step.output = output
        step.latency_ms = latency_ms
        step.prev_hash = self._trace.steps[-1].step_hash if self._trace.steps else None
        step.step_hash = step.compute_hash()
        with self._lock:
            self._trace.steps.append(step)
        if self._engine:
            self._engine.evaluate(step, self._trace, Trigger.POST_CALL)


def verify_chain(steps: list[TraceStep]) -> bool:
    """Return True if the hash chain is intact across all steps."""
    for i, step in enumerate(steps):
        if step.step_hash != step.compute_hash():
            return False
        expected_prev = steps[i - 1].step_hash if i > 0 else None
        if step.prev_hash != expected_prev:
            return False
    return True

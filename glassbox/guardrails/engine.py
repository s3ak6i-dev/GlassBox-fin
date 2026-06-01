from __future__ import annotations

import time
import warnings
from collections import defaultdict
from datetime import datetime
from typing import TYPE_CHECKING

from glassbox.guardrails.exceptions import ComplianceHaltError, ComplianceWarning
from glassbox.guardrails.policy import GuardrailPolicy
from glassbox.models import Trigger

if TYPE_CHECKING:
    from glassbox.models import AgentTrace, TraceStep, Violation
    from glassbox.rules.base import Rule


class GuardrailEngine:
    def __init__(self, rules: list["Rule"], policy: GuardrailPolicy) -> None:
        self._policy = policy
        self._rules_by_trigger: dict[Trigger, list["Rule"]] = defaultdict(list)
        for rule in rules:
            self._rules_by_trigger[rule.trigger].append(rule)

    def evaluate(self, step: "TraceStep", trace: "AgentTrace", trigger: Trigger) -> None:
        for rule in self._rules_by_trigger.get(trigger, []):
            try:
                violations = rule.evaluate(step, trace)
            except Exception as exc:
                trace.metadata.setdefault("rule_errors", []).append(
                    {"rule_id": rule.id, "error": str(exc)}
                )
                continue
            for v in violations:
                v.detected_at = trigger.value
                self._dispatch(v, trace)

    def evaluate_post_session(self, trace: "AgentTrace") -> None:
        dummy_step = trace.steps[-1] if trace.steps else None
        for rule in self._rules_by_trigger.get(Trigger.POST_SESSION, []):
            try:
                step = dummy_step or _sentinel_step()
                violations = rule.evaluate(step, trace)
            except Exception as exc:
                trace.metadata.setdefault("rule_errors", []).append(
                    {"rule_id": rule.id, "error": str(exc)}
                )
                continue
            for v in violations:
                v.detected_at = Trigger.POST_SESSION.value
                v.resolution = "logged"
                trace.metadata.setdefault("guardrail_violations", []).append(v)

    def _dispatch(self, v: "Violation", trace: "AgentTrace") -> None:
        action = self._policy.action_for(v.severity)

        if action == "log":
            v.resolution = "logged"
            trace.metadata.setdefault("guardrail_violations", []).append(v)
            warnings.warn(str(v), ComplianceWarning, stacklevel=4)

        elif action == "raise":
            v.resolution = "auto_halted"
            raise ComplianceHaltError(v)

        elif action == "pause":
            if self._policy.approver is None:
                raise ValueError(
                    "GuardrailPolicy.approver must be set when action is 'pause'"
                )
            t0 = time.perf_counter()
            approved = self._policy.approver(v)
            v.approval_latency_ms = (time.perf_counter() - t0) * 1000
            v.approval_timestamp = datetime.utcnow()
            if approved:
                v.resolution = "approved"
                trace.metadata.setdefault("guardrail_violations", []).append(v)
            else:
                v.resolution = "rejected"
                raise ComplianceHaltError(v)


def _sentinel_step() -> "TraceStep":
    from glassbox.models import TraceStep
    from datetime import datetime
    return TraceStep(
        step_id="__post_session__",
        timestamp=datetime.utcnow(),
        step_type="decision",
    )

import warnings
from datetime import datetime

import pytest

from glassbox.guardrails.engine import GuardrailEngine
from glassbox.guardrails.exceptions import ComplianceHaltError, ComplianceWarning
from glassbox.guardrails.policy import GuardrailPolicy
from glassbox.models import AgentTrace, Severity, TraceStep, Trigger, Violation
from glassbox.rules.base import Rule


def make_trace() -> AgentTrace:
    return AgentTrace()


def make_step() -> TraceStep:
    return TraceStep(step_id="s1", timestamp=datetime.utcnow(), step_type="tool_call")


def make_violation(step: TraceStep, severity: Severity = Severity.CRITICAL) -> Violation:
    return Violation(
        violation_id="v1",
        rule_id="TEST_RULE",
        severity=severity,
        step=step,
        message="test violation",
    )


class AlwaysFireRule(Rule):
    id = "ALWAYS_FIRE"
    severity = Severity.CRITICAL
    trigger = Trigger.PRE_CALL
    description = "Always fires"

    def __init__(self, sev: Severity = Severity.CRITICAL):
        self.severity = sev

    def evaluate(self, step, trace):
        return [Violation.from_step(step, self)]


class NeverFireRule(Rule):
    id = "NEVER_FIRE"
    severity = Severity.LOW
    trigger = Trigger.PRE_CALL
    description = "Never fires"

    def evaluate(self, step, trace):
        return []


class BrokenRule(Rule):
    id = "BROKEN"
    severity = Severity.HIGH
    trigger = Trigger.PRE_CALL
    description = "Always raises"

    def evaluate(self, step, trace):
        raise RuntimeError("rule exploded")


# ── GuardrailPolicy ────────────────────────────────────────────────────────────

class TestGuardrailPolicy:
    def test_action_for_severity(self):
        p = GuardrailPolicy(on_critical="raise", on_high="log")
        assert p.action_for(Severity.CRITICAL) == "raise"
        assert p.action_for(Severity.HIGH) == "log"
        assert p.action_for(Severity.LOW) == "log"

    def test_invalid_action_raises(self):
        with pytest.raises(ValueError):
            GuardrailPolicy(on_critical="explode")

    def test_on_low_must_be_log(self):
        with pytest.raises((ValueError, TypeError)):
            GuardrailPolicy(on_low="raise")

    def test_pause_requires_approver(self):
        policy = GuardrailPolicy(on_critical="pause", approver=None)
        engine = GuardrailEngine([AlwaysFireRule()], policy)
        step = make_step()
        trace = make_trace()
        with pytest.raises(ValueError, match="approver"):
            engine.evaluate(step, trace, Trigger.PRE_CALL)


# ── GuardrailEngine ────────────────────────────────────────────────────────────

class TestGuardrailEngine:
    def test_log_action_records_violation(self):
        policy = GuardrailPolicy(on_critical="log")
        engine = GuardrailEngine([AlwaysFireRule()], policy)
        step = make_step()
        trace = make_trace()
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            engine.evaluate(step, trace, Trigger.PRE_CALL)
        assert len(trace.metadata.get("guardrail_violations", [])) == 1
        assert any(issubclass(warning.category, ComplianceWarning) for warning in w)

    def test_raise_action_halts(self):
        policy = GuardrailPolicy(on_critical="raise")
        engine = GuardrailEngine([AlwaysFireRule()], policy)
        step = make_step()
        trace = make_trace()
        with pytest.raises(ComplianceHaltError) as exc_info:
            engine.evaluate(step, trace, Trigger.PRE_CALL)
        assert exc_info.value.violation.rule_id == "ALWAYS_FIRE"
        assert exc_info.value.violation.resolution == "auto_halted"

    def test_pause_approver_returns_true_continues(self):
        policy = GuardrailPolicy(on_critical="pause", approver=lambda v: True)
        engine = GuardrailEngine([AlwaysFireRule()], policy)
        step = make_step()
        trace = make_trace()
        engine.evaluate(step, trace, Trigger.PRE_CALL)  # should not raise
        violations = trace.metadata.get("guardrail_violations", [])
        assert len(violations) == 1
        assert violations[0].resolution == "approved"
        assert violations[0].approval_latency_ms is not None

    def test_pause_approver_returns_false_halts(self):
        policy = GuardrailPolicy(on_critical="pause", approver=lambda v: False)
        engine = GuardrailEngine([AlwaysFireRule()], policy)
        step = make_step()
        trace = make_trace()
        with pytest.raises(ComplianceHaltError) as exc_info:
            engine.evaluate(step, trace, Trigger.PRE_CALL)
        assert exc_info.value.violation.resolution == "rejected"

    def test_never_fire_rule_produces_no_violations(self):
        policy = GuardrailPolicy(on_low="log")
        engine = GuardrailEngine([NeverFireRule()], policy)
        step = make_step()
        trace = make_trace()
        engine.evaluate(step, trace, Trigger.PRE_CALL)
        assert trace.metadata.get("guardrail_violations", []) == []

    def test_broken_rule_records_error_and_continues(self):
        policy = GuardrailPolicy(on_high="log")
        engine = GuardrailEngine([BrokenRule()], policy)
        step = make_step()
        trace = make_trace()
        engine.evaluate(step, trace, Trigger.PRE_CALL)  # should NOT raise
        errors = trace.metadata.get("rule_errors", [])
        assert len(errors) == 1
        assert errors[0]["rule_id"] == "BROKEN"

    def test_only_matching_trigger_fires(self):
        # Rule is PRE_CALL but we evaluate with POST_CALL — should not fire
        policy = GuardrailPolicy(on_critical="raise")
        engine = GuardrailEngine([AlwaysFireRule()], policy)
        step = make_step()
        trace = make_trace()
        engine.evaluate(step, trace, Trigger.POST_CALL)  # different trigger
        assert trace.metadata.get("guardrail_violations", []) == []

    def test_high_severity_log_action(self):
        policy = GuardrailPolicy(on_high="log")
        engine = GuardrailEngine([AlwaysFireRule(Severity.HIGH)], policy)
        step = make_step()
        trace = make_trace()
        with warnings.catch_warnings(record=True):
            warnings.simplefilter("always")
            engine.evaluate(step, trace, Trigger.PRE_CALL)
        violations = trace.metadata.get("guardrail_violations", [])
        assert len(violations) == 1
        assert violations[0].severity == Severity.HIGH

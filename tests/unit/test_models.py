from datetime import datetime

import pytest

from glassbox.models import AgentTrace, Severity, TraceStep, Trigger, Violation


def make_step(**kwargs) -> TraceStep:
    defaults = dict(step_id="s1", timestamp=datetime.utcnow(), step_type="llm_call")
    defaults.update(kwargs)
    return TraceStep(**defaults)


def test_tracestep_valid():
    s = make_step()
    assert s.step_type == "llm_call"
    assert s.step_hash is None


def test_tracestep_invalid_type():
    with pytest.raises(ValueError):
        make_step(step_type="invalid")


def test_tracestep_hash_is_deterministic():
    s = make_step(output="hello")
    h1 = s.compute_hash()
    h2 = s.compute_hash()
    assert h1 == h2
    assert len(h1) == 64  # SHA-256 hex


def test_tracestep_hash_changes_with_output():
    s1 = make_step(output="hello")
    s2 = make_step(output="world")
    assert s1.compute_hash() != s2.compute_hash()


def test_agent_trace_defaults():
    t = AgentTrace()
    assert t.trace_id
    assert isinstance(t.session_start, datetime)
    assert t.steps == []
    assert not t.halted


def test_agent_trace_add_step():
    t = AgentTrace()
    s = make_step()
    t.add_step(s)
    assert len(t.steps) == 1


def test_violation_from_step():
    class FakeRule:
        id = "FAKE"
        severity = Severity.HIGH
        description = "test violation"
        regulatory_reference = "Art.1"
        remediation = "fix it"

    s = make_step()
    v = Violation.from_step(s, FakeRule())
    assert v.rule_id == "FAKE"
    assert v.severity == Severity.HIGH
    assert v.step is s
    assert v.regulatory_reference == "Art.1"


def test_severity_enum_values():
    assert Severity.CRITICAL.value == "CRITICAL"
    assert Severity.HIGH.value == "HIGH"


def test_trigger_enum_values():
    assert Trigger.PRE_CALL.value == "pre_call"
    assert Trigger.POST_SESSION.value == "post_session"

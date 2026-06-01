import json
from datetime import datetime

from glassbox.models import AgentTrace, Severity, TraceStep, Violation
from glassbox.reporter.json_reporter import JsonReporter
from glassbox.tracer import verify_chain


def make_trace_with_steps() -> tuple[AgentTrace, list[Violation]]:
    trace = AgentTrace(task_description="test session", jurisdiction="EU")

    s1 = TraceStep(step_id="s1", timestamp=datetime.utcnow(), step_type="llm_call",
                   model="gpt-4o", prompt="assess loan", output="I will assess the loan.")
    s1.prev_hash = None
    s1.step_hash = s1.compute_hash()
    trace.add_step(s1)

    s2 = TraceStep(step_id="s2", timestamp=datetime.utcnow(), step_type="tool_call",
                   tool_name="get_credit_score", tool_arguments={"id": "A-42"}, output="612")
    s2.prev_hash = s1.step_hash
    s2.step_hash = s2.compute_hash()
    trace.add_step(s2)

    v = Violation(
        violation_id="v1",
        rule_id="PII_IN_TOOL_ARGS",
        severity=Severity.CRITICAL,
        step=s1,
        message="PII detected",
        regulatory_reference="GDPR Art.9",
        remediation="Redact",
        detected_at="pre_call",
        resolution="approved",
    )
    return trace, [v]


def test_json_output_has_required_keys():
    trace, violations = make_trace_with_steps()
    reporter = JsonReporter(trace, violations)
    payload = reporter.build()
    for key in ("schema_version", "trace_id", "session", "summary", "steps", "violations", "integrity"):
        assert key in payload, f"Missing key: {key}"


def test_summary_counts():
    trace, violations = make_trace_with_steps()
    payload = JsonReporter(trace, violations).build()
    assert payload["summary"]["total_steps"] == 2
    assert payload["summary"]["total_violations"] == 1
    assert payload["summary"]["by_severity"]["CRITICAL"] == 1
    assert payload["summary"]["by_severity"]["HIGH"] == 0


def test_integrity_chain_valid():
    trace, violations = make_trace_with_steps()
    payload = JsonReporter(trace, violations).build()
    assert payload["integrity"]["chain_valid"] is True


def test_integrity_chain_invalid_after_tamper():
    trace, violations = make_trace_with_steps()
    trace.steps[0].output = "TAMPERED"  # change output without recomputing hash
    assert verify_chain(trace.steps) is False
    payload = JsonReporter(trace, violations).build()
    assert payload["integrity"]["chain_valid"] is False


def test_json_serialisable(tmp_path):
    trace, violations = make_trace_with_steps()
    out = tmp_path / "trail.json"
    JsonReporter(trace, violations).write(str(out))
    with open(out) as f:
        data = json.load(f)
    assert data["trace_id"] == trace.trace_id


def test_session_fields():
    trace, violations = make_trace_with_steps()
    payload = JsonReporter(trace, violations).build()
    assert payload["session"]["name"] == "test session"
    assert payload["session"]["jurisdiction"] == "EU"
    assert payload["session"]["halted"] is False

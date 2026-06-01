from datetime import datetime

import pytest

from glassbox.models import AgentTrace, Severity, TraceStep, Trigger
from glassbox.rules.financial import (
    DTIRationale,
    DecisionWithoutTrace,
    Jurisdiction,
    PII,
    RetentionWindowExceeded,
    StaleMarketContext,
    ThresholdBypass,
    UnverifiedDataSource,
)


def make_trace(**kwargs) -> AgentTrace:
    return AgentTrace(jurisdiction=kwargs.get("jurisdiction"), **{k: v for k, v in kwargs.items() if k != "jurisdiction"})


def make_step(step_type="llm_call", **kwargs) -> TraceStep:
    return TraceStep(step_id="s1", timestamp=datetime.utcnow(), step_type=step_type, **kwargs)


# ── PII ──────────────────────────────────────────────────────────────────────

class TestPII:
    def test_no_pii_clean_args(self):
        step = make_step("tool_call", tool_name="lookup", tool_arguments={"applicant": "John"})
        trace = make_trace()
        assert PII().evaluate(step, trace) == []

    def test_detects_bsn(self):
        step = make_step("tool_call", tool_name="send_email",
                         tool_arguments={"body": "BSN 841295302 approved"})
        trace = make_trace()
        vs = PII().evaluate(step, trace)
        assert len(vs) == 1
        assert vs[0].severity == Severity.CRITICAL
        assert "BSN" in vs[0].message

    def test_detects_iban(self):
        step = make_step("tool_call", tool_name="transfer",
                         tool_arguments={"account": "NL91ABNA0417164300"})
        trace = make_trace()
        vs = PII().evaluate(step, trace)
        assert len(vs) == 1
        assert "IBAN" in vs[0].message

    def test_detects_email(self):
        step = make_step("tool_call", tool_name="notify",
                         tool_arguments={"to": "user@example.com"})
        trace = make_trace()
        vs = PII().evaluate(step, trace)
        assert len(vs) == 1
        assert "EMAIL" in vs[0].message

    def test_skips_non_tool_steps(self):
        step = make_step("llm_call", prompt="BSN 841295302")
        trace = make_trace()
        assert PII().evaluate(step, trace) == []

    def test_skips_empty_tool_args(self):
        step = make_step("tool_call", tool_name="lookup", tool_arguments=None)
        trace = make_trace()
        assert PII().evaluate(step, trace) == []


# ── DecisionWithoutTrace ──────────────────────────────────────────────────────

class TestDecisionWithoutTrace:
    def test_flags_empty_trace(self):
        step = make_step("decision", output="APPROVE")
        trace = make_trace()
        vs = DecisionWithoutTrace().evaluate(step, trace)
        assert len(vs) == 1
        assert vs[0].severity == Severity.CRITICAL

    def test_flags_insufficient_steps(self):
        step = make_step("decision", output="APPROVE")
        trace = make_trace()
        trace.add_step(make_step("llm_call"))  # only 1 step
        vs = DecisionWithoutTrace().evaluate(step, trace)
        assert len(vs) == 1

    def test_no_flag_with_sufficient_steps(self):
        step = make_step("decision", output="APPROVE")
        trace = make_trace()
        trace.add_step(make_step("llm_call"))
        trace.add_step(make_step("tool_call"))
        vs = DecisionWithoutTrace().evaluate(step, trace)
        assert vs == []

    def test_skips_non_decision_steps(self):
        step = make_step("llm_call")
        trace = make_trace()
        assert DecisionWithoutTrace().evaluate(step, trace) == []

    def test_custom_min_steps(self):
        step = make_step("decision")
        trace = make_trace()
        trace.add_step(make_step("llm_call"))
        trace.add_step(make_step("tool_call"))
        trace.add_step(make_step("llm_call"))
        # With min_steps=5 should still flag
        vs = DecisionWithoutTrace(min_steps=5).evaluate(step, trace)
        assert len(vs) == 1


# ── DTIRationale ──────────────────────────────────────────────────────────────

class TestDTIRationale:
    def _credit_trace_with_dti(self) -> tuple[TraceStep, AgentTrace]:
        trace = make_trace()
        trace.add_step(make_step("llm_call", prompt="evaluate loan application",
                                  output="The DTI is 32%, which is acceptable."))
        step = trace.steps[-1]
        return step, trace

    def _credit_trace_no_dti(self) -> tuple[TraceStep, AgentTrace]:
        trace = make_trace()
        step = make_step("llm_call", prompt="evaluate loan application",
                         output="The applicant has a good credit score.")
        trace.add_step(step)
        return step, trace

    def test_no_flag_when_dti_present(self):
        step, trace = self._credit_trace_with_dti()
        assert DTIRationale().evaluate(step, trace) == []

    def test_flags_when_dti_missing(self):
        step, trace = self._credit_trace_no_dti()
        vs = DTIRationale().evaluate(step, trace)
        assert len(vs) == 1
        assert vs[0].severity == Severity.HIGH

    def test_no_flag_for_non_credit_session(self):
        step = make_step("llm_call", output="The weather is nice today.")
        trace = make_trace()
        trace.add_step(step)
        assert DTIRationale().evaluate(step, trace) == []


# ── Jurisdiction ──────────────────────────────────────────────────────────────

class TestJurisdiction:
    def test_flags_us_regulation_in_eu_session(self):
        step = make_step("llm_call", output="This complies with SEC regulations and FINRA rules.")
        trace = make_trace(jurisdiction="EU")
        vs = Jurisdiction("EU").evaluate(step, trace)
        assert len(vs) == 1
        assert vs[0].severity == Severity.HIGH

    def test_no_flag_for_correct_jurisdiction(self):
        step = make_step("llm_call", output="This complies with MiFID II and GDPR requirements.")
        trace = make_trace(jurisdiction="EU")
        vs = Jurisdiction("EU").evaluate(step, trace)
        assert vs == []

    def test_no_flag_for_step_without_output(self):
        step = make_step("llm_call")
        trace = make_trace(jurisdiction="EU")
        assert Jurisdiction("EU").evaluate(step, trace) == []


# ── ThresholdBypass ───────────────────────────────────────────────────────────

class TestThresholdBypass:
    def test_flags_decision_without_numeric(self):
        step = make_step("decision", output="We approve the application.")
        trace = make_trace()
        vs = ThresholdBypass().evaluate(step, trace)
        assert len(vs) == 1
        assert vs[0].severity == Severity.HIGH

    def test_no_flag_when_numeric_present(self):
        step = make_step("decision", output="We approve: credit score 720 exceeds threshold 680.")
        trace = make_trace()
        assert ThresholdBypass().evaluate(step, trace) == []

    def test_no_flag_for_non_decision_steps(self):
        step = make_step("llm_call", output="No number here.")
        trace = make_trace()
        assert ThresholdBypass().evaluate(step, trace) == []


# ── RetentionWindowExceeded ───────────────────────────────────────────────────

class TestRetentionWindowExceeded:
    def test_no_flag_for_fresh_trace(self):
        step = make_step()
        trace = make_trace()
        assert RetentionWindowExceeded().evaluate(step, trace) == []

    def test_flags_old_trace(self):
        from datetime import timedelta
        step = make_step()
        trace = AgentTrace(session_start=datetime.utcnow() - timedelta(days=400))
        vs = RetentionWindowExceeded(retention_days=365).evaluate(step, trace)
        assert len(vs) == 1
        assert vs[0].severity == Severity.MEDIUM

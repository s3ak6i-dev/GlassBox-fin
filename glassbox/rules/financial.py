from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from glassbox.models import Severity, Trigger, Violation
from glassbox.rules.base import Rule

if TYPE_CHECKING:
    from glassbox.models import AgentTrace, TraceStep

# ── PII patterns ──────────────────────────────────────────────────────────────

_PII_PATTERNS: dict[str, re.Pattern] = {
    "BSN":   re.compile(r"\b\d{3}[\s.]?\d{2,3}[\s.]?\d{3}\b"),
    "IBAN":  re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b"),
    "EMAIL": re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"),
    "PHONE": re.compile(r"\+?[0-9][\s\-()\\.0-9]{6,14}[0-9]"),
    "CC":    re.compile(r"\b(?:\d[ \-]?){13,19}\b"),
}

_CREDIT_KEYWORDS = re.compile(r"\b(loan|credit|mortgage|dti|debt|applicant|score)\b", re.I)
_DTI_PATTERN = re.compile(r"dti|debt[\s\-]?to[\s\-]?income", re.I)
_THRESHOLD_NUMERIC = re.compile(r"\b\d+\.?\d*\b")


def _luhn_valid(number: str) -> bool:
    digits = [int(d) for d in re.sub(r"\D", "", number)]
    if len(digits) < 13:
        return False
    total = 0
    for i, d in enumerate(reversed(digits)):
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def _scan_pii(text: str) -> list[str]:
    found: list[str] = []
    for label, pattern in _PII_PATTERNS.items():
        matches = pattern.findall(text)
        if label == "CC":
            matches = [m for m in matches if _luhn_valid(m)]
        if matches:
            found.append(label)
    return found


# ── Built-in rules ─────────────────────────────────────────────────────────────

class PII(Rule):
    id = "PII_IN_TOOL_ARGS"
    severity = Severity.CRITICAL
    trigger = Trigger.PRE_CALL
    description = "Personal identifiers detected in tool call arguments"
    regulatory_reference = "GDPR Art.9, EU AI Act Art.10"
    remediation = "Redact PII before passing data to tool arguments"

    def __init__(self, use_ner: bool = False) -> None:
        self.use_ner = use_ner

    def evaluate(self, step: "TraceStep", trace: "AgentTrace") -> list[Violation]:
        if step.step_type != "tool_call" or not step.tool_arguments:
            return []
        text = json.dumps(step.tool_arguments, default=str)
        found = _scan_pii(text)
        if not found:
            return []
        v = Violation.from_step(step, self)
        v.message = f"PII detected in tool '{step.tool_name}' arguments: {', '.join(found)}"
        return [v]


class DecisionWithoutTrace(Rule):
    id = "DECISION_WITHOUT_TRACE"
    severity = Severity.CRITICAL
    trigger = Trigger.PRE_DECISION
    description = "Decision produced with no traceable reasoning chain"
    regulatory_reference = "EU AI Act Art.13"
    remediation = "Ensure the agent makes at least 2 LLM or tool calls before producing a decision"

    def __init__(self, min_steps: int = 2) -> None:
        self.min_steps = min_steps

    def evaluate(self, step: "TraceStep", trace: "AgentTrace") -> list[Violation]:
        if step.step_type != "decision":
            return []
        preceding = [s for s in trace.steps if s.step_type in ("llm_call", "tool_call")]
        if len(preceding) < self.min_steps:
            v = Violation.from_step(step, self)
            v.message = (
                f"Decision reached with only {len(preceding)} preceding call(s); "
                f"minimum required is {self.min_steps}"
            )
            return [v]
        return []


class DTIRationale(Rule):
    id = "MISSING_DTI_RATIONALE"
    severity = Severity.HIGH
    trigger = Trigger.POST_CALL
    description = "Credit decision does not cite debt-to-income ratio"
    regulatory_reference = "EBA GL/2020/06"
    remediation = "Ensure the agent explicitly references DTI in its reasoning for credit decisions"

    def evaluate(self, step: "TraceStep", trace: "AgentTrace") -> list[Violation]:
        # Only applies to credit-related sessions
        all_text = " ".join(
            (s.prompt or "") + " " + (s.output or "") for s in trace.steps
        )
        if not _CREDIT_KEYWORDS.search(all_text):
            return []
        # Check if any step output references DTI
        for s in trace.steps:
            if s.output and _DTI_PATTERN.search(s.output):
                return []
        # No DTI reference found — only flag once (when the last step completes)
        if step != trace.steps[-1] if trace.steps else True:
            return []
        v = Violation.from_step(step, self)
        v.message = "No debt-to-income ratio reference found in any step output for this credit session"
        return [v]


class Jurisdiction(Rule):
    id = "JURISDICTION_MISMATCH"
    severity = Severity.HIGH
    trigger = Trigger.POST_CALL
    description = "Agent applies regulations from the wrong jurisdiction"
    regulatory_reference = "MiFID II Art.24"
    remediation = "Configure the session jurisdiction and ensure the agent cites matching regulations"

    _JURISDICTION_KEYWORDS: dict[str, list[str]] = {
        "EU":  ["sec ", "finra", "reg-bi", "dodd-frank", "fca "],
        "US":  ["mifid", "eu ai act", "esma", "eba "],
        "UK":  ["mifid", "eu ai act", "esma", "sec ", "finra"],
    }

    def __init__(self, code: str) -> None:
        self.code = code.upper()

    def evaluate(self, step: "TraceStep", trace: "AgentTrace") -> list[Violation]:
        if not step.output:
            return []
        configured = (trace.jurisdiction or self.code).upper()
        opposing = self._JURISDICTION_KEYWORDS.get(configured, [])
        output_lower = step.output.lower()
        for keyword in opposing:
            if keyword in output_lower:
                v = Violation.from_step(step, self)
                v.message = (
                    f"Session configured for {configured} but agent output references "
                    f"'{keyword.strip()}' regulation"
                )
                return [v]
        return []


class ThresholdBypass(Rule):
    id = "THRESHOLD_BYPASS"
    severity = Severity.HIGH
    trigger = Trigger.POST_CALL
    description = "Decision made without citing the numeric threshold used"
    regulatory_reference = "Basel III"
    remediation = "Ensure the agent explicitly states the threshold value driving its decision"

    _DECISION_KEYWORDS = re.compile(r"\b(approve|reject|deny|accept|decline|flag)\b", re.I)

    def evaluate(self, step: "TraceStep", trace: "AgentTrace") -> list[Violation]:
        if step.step_type != "decision" or not step.output:
            return []
        if not self._DECISION_KEYWORDS.search(step.output):
            return []
        if _THRESHOLD_NUMERIC.search(step.output):
            return []
        v = Violation.from_step(step, self)
        v.message = "Decision output contains no numeric threshold reference"
        return [v]


class UnverifiedDataSource(Rule):
    id = "UNVERIFIED_DATA_SOURCE"
    severity = Severity.MEDIUM
    trigger = Trigger.POST_CALL
    description = "Tool output consumed without source provenance marker"
    regulatory_reference = "EU AI Act Art.10"
    remediation = "Include a source identifier or provenance marker in tool return values"

    _SOURCE_PATTERNS = re.compile(
        r"\b(source|from|via|retrieved from|data from|according to|ref:|url:|doi:)\b", re.I
    )

    def evaluate(self, step: "TraceStep", trace: "AgentTrace") -> list[Violation]:
        if step.step_type != "tool_call" or not step.output:
            return []
        if self._SOURCE_PATTERNS.search(step.output):
            return []
        # Only flag if the output was actually used in a subsequent LLM call
        step_idx = next(
            (i for i, s in enumerate(trace.steps) if s.step_id == step.step_id), None
        )
        if step_idx is None:
            return []
        subsequent_prompts = " ".join(
            s.prompt or "" for s in trace.steps[step_idx + 1 :] if s.step_type == "llm_call"
        )
        snippet = (step.output or "")[:80]
        if snippet and snippet[:20] in subsequent_prompts:
            v = Violation.from_step(step, self)
            v.message = (
                f"Tool '{step.tool_name}' output has no source provenance marker "
                "but was used in a subsequent LLM call"
            )
            return [v]
        return []


class StaleMarketContext(Rule):
    id = "STALE_MARKET_CONTEXT"
    severity = Severity.MEDIUM
    trigger = Trigger.POST_CALL
    description = "Market data retrieved before the allowed staleness window"
    regulatory_reference = "MiFID II Art.25"
    remediation = "Refresh market data within the session or reduce max_age_minutes"

    _MARKET_KEYWORDS = re.compile(
        r"\b(price|market|rate|yield|spread|index|quote|bid|ask|nav)\b", re.I
    )

    def __init__(self, max_age_minutes: int = 60) -> None:
        self.max_age_minutes = max_age_minutes

    def evaluate(self, step: "TraceStep", trace: "AgentTrace") -> list[Violation]:
        if step.step_type != "tool_call":
            return []
        tool_text = json.dumps(step.tool_arguments or {}) + (step.output or "")
        if not self._MARKET_KEYWORDS.search(tool_text):
            return []
        age_minutes = (step.timestamp - trace.session_start).total_seconds() / 60
        # Negative means tool timestamp predates session start (stale cached data)
        if age_minutes < -self.max_age_minutes:
            v = Violation.from_step(step, self)
            v.message = (
                f"Market data from tool '{step.tool_name}' is "
                f"{abs(age_minutes):.0f} minutes old (limit: {self.max_age_minutes})"
            )
            return [v]
        return []


class RetentionWindowExceeded(Rule):
    id = "RETENTION_WINDOW_EXCEEDED"
    severity = Severity.MEDIUM
    trigger = Trigger.POST_SESSION
    description = "Trace contains data older than the configured retention window"
    regulatory_reference = "GDPR Art.5(1)(e)"
    remediation = "Delete or anonymise traces older than the retention window"

    def __init__(self, retention_days: int = 365) -> None:
        self.retention_days = retention_days

    def evaluate(self, step: "TraceStep", trace: "AgentTrace") -> list[Violation]:
        age_days = (datetime.utcnow() - trace.session_start).days
        if age_days > self.retention_days:
            v = Violation.from_step(step, self)
            v.message = (
                f"Trace is {age_days} days old; retention limit is {self.retention_days} days"
            )
            return [v]
        return []

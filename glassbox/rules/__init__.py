from __future__ import annotations

from typing import TYPE_CHECKING, Any, Callable, Optional

from glassbox.models import Severity, Trigger, Violation
from glassbox.rules.base import Rule
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

if TYPE_CHECKING:
    from glassbox.models import AgentTrace, TraceStep

RULE_REGISTRY: dict[str, type[Rule]] = {
    cls.id: cls  # type: ignore[attr-defined]
    for cls in (
        PII, DecisionWithoutTrace, DTIRationale, Jurisdiction,
        ThresholdBypass, UnverifiedDataSource, StaleMarketContext, RetentionWindowExceeded,
    )
}

DEFAULT_RULES: list[Rule] = [
    PII(),
    DecisionWithoutTrace(),
    DTIRationale(),
    ThresholdBypass(),
]


def rule(
    id: str,
    severity: Severity,
    trigger: Trigger = Trigger.POST_SESSION,
    description: str = "",
    regulatory_reference: Optional[str] = None,
    remediation: Optional[str] = None,
) -> Callable[[Callable], Rule]:
    """Decorator for defining custom rules as functions."""

    def decorator(fn: Callable) -> Rule:
        cls = type(
            fn.__name__,
            (Rule,),
            {
                "id": id,
                "severity": severity,
                "trigger": trigger,
                "description": description,
                "regulatory_reference": regulatory_reference,
                "remediation": remediation,
                "evaluate": lambda self, step, trace: fn(step, trace),
            },
        )
        instance = cls()
        RULE_REGISTRY[id] = cls
        return instance

    return decorator


__all__ = [
    "Rule", "Severity", "Trigger", "Violation",
    "PII", "DecisionWithoutTrace", "DTIRationale", "Jurisdiction",
    "ThresholdBypass", "UnverifiedDataSource", "StaleMarketContext", "RetentionWindowExceeded",
    "DEFAULT_RULES", "RULE_REGISTRY", "rule",
]

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from glassbox.models import Severity, Trigger, Violation

if TYPE_CHECKING:
    from glassbox.models import AgentTrace, TraceStep


class Rule:
    id: str
    severity: Severity
    trigger: Trigger
    description: str
    regulatory_reference: Optional[str] = None
    remediation: Optional[str] = None

    def __init_subclass__(cls, **kwargs: object) -> None:
        super().__init_subclass__(**kwargs)
        for attr in ("id", "severity", "trigger", "description"):
            if not hasattr(cls, attr):
                raise TypeError(f"{cls.__name__} must define class attribute '{attr}'")

    def evaluate(self, step: "TraceStep", trace: "AgentTrace") -> list[Violation]:
        raise NotImplementedError(f"{self.__class__.__name__}.evaluate() not implemented")

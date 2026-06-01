from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Callable, Literal, Optional

from glassbox.models import Severity

if TYPE_CHECKING:
    from glassbox.models import Violation

_VALID_ACTIONS = frozenset({"pause", "raise", "log"})


@dataclass
class GuardrailPolicy:
    on_critical: Literal["pause", "raise", "log"] = "pause"
    on_high: Literal["pause", "raise", "log"] = "log"
    on_medium: Literal["pause", "raise", "log"] = "log"
    on_low: Literal["log"] = "log"
    approver: Optional[Callable[["Violation"], bool]] = field(default=None, repr=False)

    def __post_init__(self) -> None:
        for attr in ("on_critical", "on_high", "on_medium", "on_low"):
            val = getattr(self, attr)
            if val not in _VALID_ACTIONS:
                raise ValueError(f"GuardrailPolicy.{attr} must be one of {sorted(_VALID_ACTIONS)}, got {val!r}")
        if self.on_low != "log":
            raise ValueError("GuardrailPolicy.on_low must be 'log'")

    def action_for(self, severity: Severity) -> str:
        return getattr(self, f"on_{severity.value.lower()}")

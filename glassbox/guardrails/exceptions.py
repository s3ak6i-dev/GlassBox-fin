from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from glassbox.models import Violation


class ComplianceHaltError(Exception):
    """Raised when a guardrail violation is rejected or action='raise'."""

    def __init__(self, violation: "Violation") -> None:
        self.violation = violation
        super().__init__(f"[{violation.severity}] {violation.rule_id}: {violation.message}")


class ComplianceWarning(UserWarning):
    """Issued for logged violations that do not halt execution."""

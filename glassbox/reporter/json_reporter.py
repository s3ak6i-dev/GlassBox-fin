from __future__ import annotations

import dataclasses
import json
from datetime import datetime
from enum import Enum
from typing import Any

from glassbox.models import AgentTrace, Violation
from glassbox.tracer import verify_chain


class _Encoder(json.JSONEncoder):
    def default(self, o: Any) -> Any:
        if isinstance(o, datetime):
            return o.isoformat()
        if isinstance(o, Enum):
            return o.value
        if dataclasses.is_dataclass(o) and not isinstance(o, type):
            return dataclasses.asdict(o)
        return super().default(o)


class JsonReporter:
    SCHEMA_VERSION = "1.0"

    def __init__(self, trace: AgentTrace, violations: list[Violation]) -> None:
        self._trace = trace
        self._violations = violations

    def build(self) -> dict:
        t = self._trace
        vs = self._violations

        by_severity: dict[str, int] = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for v in vs:
            by_severity[v.severity.value] = by_severity.get(v.severity.value, 0) + 1

        return {
            "schema_version": self.SCHEMA_VERSION,
            "trace_id": t.trace_id,
            "session": {
                "name": t.task_description,
                "start": t.session_start,
                "end": t.session_end,
                "jurisdiction": t.jurisdiction,
                "halted": t.halted,
                "halt_reason": t.halt_reason,
            },
            "summary": {
                "total_steps": len(t.steps),
                "total_violations": len(vs),
                "by_severity": by_severity,
            },
            "steps": t.steps,
            "violations": vs,
            "integrity": {
                "algorithm": "sha256",
                "chain_valid": verify_chain(t.steps),
            },
            "metadata": t.metadata,
        }

    def write(self, path: str) -> None:
        payload = self.build()
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, cls=_Encoder, indent=2)

    def dumps(self) -> str:
        return json.dumps(self.build(), cls=_Encoder, indent=2)

"""HTTP client for streaming traces to the glassbox platform.

Uses only stdlib (urllib) so the SDK has zero extra dependencies
when instrumentation_key mode is enabled.
"""
from __future__ import annotations

import json
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional

if TYPE_CHECKING:
    from glassbox.models import AgentTrace, TraceStep, Violation


# ── JSON helpers ──────────────────────────────────────────────────────────────

def _default(obj: Any) -> Any:
    if isinstance(obj, datetime):
        return obj.isoformat()
    if hasattr(obj, "value"):
        return obj.value
    return str(obj)


def _dumps(data: dict) -> bytes:
    return json.dumps(data, default=_default).encode()


def step_to_dict(step: "TraceStep") -> dict:
    return {
        "step_id": step.step_id,
        "timestamp": step.timestamp,
        "step_type": step.step_type,
        "model": step.model,
        "tool_name": step.tool_name,
        "prompt": step.prompt,
        "output": step.output,
        "tool_arguments": step.tool_arguments,
        "token_count": step.token_count,
        "latency_ms": step.latency_ms,
        "step_hash": step.step_hash,
        "prev_hash": step.prev_hash,
        "metadata": step.metadata,
    }


def violation_to_dict(v: "Violation") -> dict:
    return {
        "violation_id": v.violation_id,
        "rule_id": v.rule_id,
        "severity": v.severity.value if hasattr(v.severity, "value") else v.severity,
        "step_id": v.step.step_id,
        "message": v.message,
        "regulatory_reference": v.regulatory_reference,
        "remediation": v.remediation,
        "detected_at": v.detected_at,
        "resolution": v.resolution,
        "approval_latency_ms": v.approval_latency_ms,
    }


# ── IngestClient ──────────────────────────────────────────────────────────────

class IngestClient:
    """Sends trace data to the glassbox platform API."""

    def __init__(self, instrumentation_key: str, api_url: str = "http://localhost:8000") -> None:
        self._key = instrumentation_key
        self._base = api_url.rstrip("/")
        self._headers = {
            "X-Glassbox-Key": instrumentation_key,
            "Content-Type": "application/json",
        }

    # ── Internal request helpers ───────────────────────────────────────────

    def _post(self, path: str, data: dict, timeout: int = 10) -> dict:
        req = urllib.request.Request(
            f"{self._base}{path}",
            data=_dumps(data),
            headers=self._headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())

    def _get(self, path: str, timeout: int = 10) -> dict:
        req = urllib.request.Request(
            f"{self._base}{path}",
            headers=self._headers,
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())

    def _post_async(self, path: str, data: dict) -> None:
        """Fire-and-forget — errors are silently swallowed."""
        def _run() -> None:
            try:
                self._post(path, data)
            except Exception:
                pass
        threading.Thread(target=_run, daemon=True).start()

    # ── Public API ─────────────────────────────────────────────────────────

    def start_trace(self, trace: "AgentTrace") -> None:
        self._post_async("/api/ingest/trace/start", {
            "trace_id": trace.trace_id,
            "session_start": trace.session_start,
            "task_description": trace.task_description,
            "jurisdiction": trace.jurisdiction,
        })

    def send_step(self, trace_id: str, step: "TraceStep") -> None:
        self._post_async(f"/api/ingest/trace/{trace_id}/step", step_to_dict(step))

    def end_trace(self, trace: "AgentTrace", violations: list["Violation"]) -> None:
        self._post_async(f"/api/ingest/trace/{trace.trace_id}/end", {
            "session_end": trace.session_end,
            "halted": trace.halted,
            "halt_reason": trace.halt_reason,
            "step_count": len(trace.steps),
            "violations": [violation_to_dict(v) for v in violations],
            "metadata": trace.metadata,
        })

    def create_hold_and_wait(
        self,
        trace_id: str,
        violation: "Violation",
        timeout_seconds: int = 300,
        poll_interval: float = 0.5,
    ) -> bool:
        """Create a remote hold and block until resolved or timeout.

        Returns True (approved) or False (denied/timeout).
        Raises RuntimeError if the hold cannot be created.
        """
        payload = {
            "trace_id": trace_id,
            "violation": violation_to_dict(violation),
            "step": step_to_dict(violation.step),
        }
        try:
            result = self._post("/api/ingest/hold", payload, timeout=15)
            hold_id = result["hold_id"]
        except Exception as exc:
            raise RuntimeError(f"glassbox: failed to create hold — {exc}") from exc

        deadline = time.monotonic() + timeout_seconds
        while time.monotonic() < deadline:
            try:
                data = self._get(f"/api/ingest/hold/{hold_id}")
                status = data.get("status", "pending")
                if status == "approved":
                    return True
                if status in ("denied", "expired"):
                    return False
            except Exception:
                pass
            time.sleep(poll_interval)

        return False  # Timed out — treated as denied

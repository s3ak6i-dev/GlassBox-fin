from __future__ import annotations

import time
from datetime import datetime
from typing import TYPE_CHECKING, Any, Callable, Optional
from uuid import uuid4

from glassbox.guardrails.engine import GuardrailEngine
from glassbox.guardrails.exceptions import ComplianceHaltError
from glassbox.models import AgentTrace, Violation
from glassbox.tracer import TraceCollector

if TYPE_CHECKING:
    from glassbox.adapters.anthropic import AnthropicAdapter
    from glassbox.adapters.langchain import LangChainAdapter
    from glassbox.adapters.llamaindex import LlamaIndexAdapter
    from glassbox.adapters.openai import OpenAIAdapter
    from glassbox.guardrails.policy import GuardrailPolicy
    from glassbox.rules.base import Rule


class AuditSession:
    def __init__(
        self,
        name: Optional[str] = None,
        rules: Optional[list["Rule"]] = None,
        jurisdiction: Optional[str] = None,
        guardrails: Optional["GuardrailPolicy"] = None,
        adapter=None,
        export: Optional[str] = None,
        redact_pii: bool = True,
        metadata: Optional[dict] = None,
        instrumentation_key: Optional[str] = None,
        api_url: str = "http://localhost:8000",
    ) -> None:
        from glassbox.rules import DEFAULT_RULES

        self._name = name
        self._rules = rules if rules is not None else DEFAULT_RULES
        self._jurisdiction = jurisdiction
        self._policy = guardrails
        self._explicit_adapter = adapter
        self._export = export
        self._redact_pii = redact_pii
        self._metadata = metadata or {}
        self._instrumentation_key = instrumentation_key
        self._api_url = api_url

        self._trace: Optional[AgentTrace] = None
        self._collector: Optional[TraceCollector] = None
        self._engine: Optional[GuardrailEngine] = None
        self._active_adapters: list = []
        self._post_session_violations: list[Violation] = []
        self._ingest: Optional[object] = None

    @classmethod
    def from_env(cls, name: Optional[str] = None, **overrides) -> "AuditSession":
        """Build a session from GLASSBOX_* environment variables.

        Lets `glassbox run -- python agent.py` wire everything up so your code
        only needs:  ``with AuditSession.from_env("my agent"): ...``

        Reads GLASSBOX_KEY, GLASSBOX_API_URL, GLASSBOX_JURISDICTION,
        GLASSBOX_EXPORT. Explicit keyword overrides win.
        """
        import os

        env_kwargs: dict[str, Any] = {}
        if os.environ.get("GLASSBOX_KEY"):
            env_kwargs["instrumentation_key"] = os.environ["GLASSBOX_KEY"]
        if os.environ.get("GLASSBOX_API_URL"):
            env_kwargs["api_url"] = os.environ["GLASSBOX_API_URL"]
        if os.environ.get("GLASSBOX_JURISDICTION"):
            env_kwargs["jurisdiction"] = os.environ["GLASSBOX_JURISDICTION"]
        if os.environ.get("GLASSBOX_EXPORT"):
            env_kwargs["export"] = os.environ["GLASSBOX_EXPORT"]
        env_kwargs.update(overrides)
        return cls(name=name, **env_kwargs)

    def __enter__(self) -> "AuditSession":
        self._trace = AgentTrace(
            trace_id=str(uuid4()),
            session_start=datetime.utcnow(),
            task_description=self._name,
            jurisdiction=self._jurisdiction,
            metadata=dict(self._metadata),
        )

        # Set up platform ingest client if key is provided
        step_callback = None
        if self._instrumentation_key:
            from glassbox._ingest import IngestClient
            self._ingest = IngestClient(self._instrumentation_key, self._api_url)
            self._ingest.start_trace(self._trace)  # type: ignore[union-attr]
            _trace_id = self._trace.trace_id
            _client = self._ingest
            step_callback = lambda step: _client.send_step(_trace_id, step)  # noqa: E731

            # Inject remote approver if policy has pause but no approver
            if self._policy and self._policy.on_critical == "pause" and self._policy.approver is None:
                _tid = self._trace.trace_id
                def _remote_approver(violation) -> bool:
                    return _client.create_hold_and_wait(_tid, violation)  # type: ignore[union-attr]
                self._policy.approver = _remote_approver

        self._engine = (
            GuardrailEngine(self._rules, self._policy) if self._policy else None
        )
        self._collector = TraceCollector(self._trace, self._engine, step_callback=step_callback)

        if self._explicit_adapter is not None:
            adapter = self._explicit_adapter(self._collector)
            adapter.activate()
            self._active_adapters = [adapter]
        else:
            from glassbox.adapters import detect_and_activate
            self._active_adapters = detect_and_activate(self._collector)

        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        # Deactivate all framework adapters first
        for adapter in self._active_adapters:
            try:
                adapter.deactivate()
            except Exception:
                pass
        self._active_adapters = []

        if self._trace is None:
            return False

        self._trace.session_end = datetime.utcnow()

        if isinstance(exc_val, ComplianceHaltError):
            self._trace.halted = True
            self._trace.halt_reason = str(exc_val)

        # Run POST_SESSION rules against the complete trace
        if self._engine:
            try:
                self._engine.evaluate_post_session(self._trace)
            except Exception:
                pass

        # Collect post-session violations
        self._post_session_violations = [
            v for v in self._trace.metadata.get("guardrail_violations", [])
            if v.detected_at == "post_session"
        ]

        # Post-hoc mode: no guardrail engine, evaluate all rules against completed trace
        if self._engine is None:
            from glassbox.models import Trigger
            for rule in self._rules:
                try:
                    if rule.trigger == Trigger.POST_SESSION:
                        # Runs once against the full trace using the last step as context
                        dummy = self._trace.steps[-1] if self._trace.steps else None
                        if dummy is None:
                            continue
                        violations = rule.evaluate(dummy, self._trace)
                    else:
                        # Runs against each individual step (PRE_CALL, POST_CALL, PRE_DECISION)
                        violations = []
                        for step in self._trace.steps:
                            violations.extend(rule.evaluate(step, self._trace))
                    self._post_session_violations.extend(violations)
                except Exception as exc:
                    self._trace.metadata.setdefault("rule_errors", []).append(
                        {"rule_id": rule.id, "error": str(exc)}
                    )

        if self._export:
            try:
                self.to_json(self._export)
            except Exception:
                pass

        # Stream final state to platform
        if self._ingest:
            try:
                self._ingest.end_trace(self._trace, self.violations)  # type: ignore[union-attr]
            except Exception:
                pass

        # Re-raise ComplianceHaltError so the caller knows the agent was stopped
        if isinstance(exc_val, ComplianceHaltError):
            return False

        return False

    # ── Public properties ──────────────────────────────────────────────────────

    @property
    def trace(self) -> AgentTrace:
        if self._trace is None:
            raise RuntimeError("AuditSession has not been entered yet")
        return self._trace

    @property
    def callbacks(self) -> list:
        """LangChain callback handlers to pass into your agent.

        Modern LangChain attaches callbacks per-invocation, so wire these in:
            agent.invoke(input, config={"callbacks": audit.callbacks})
        """
        out = []
        for adapter in self._active_adapters:
            handler = getattr(adapter, "handler", None)
            if handler is not None:
                out.append(handler)
        return out

    @property
    def violations(self) -> list[Violation]:
        if self._trace is None:
            return []
        guardrail_violations = self._trace.metadata.get("guardrail_violations", [])
        return guardrail_violations + self._post_session_violations

    # ── Manual instrumentation (for custom / raw agents) ────────────────────────

    def llm_call(self, model: str, prompt: str, fn: Callable[[], str],
                 token_count: Optional[int] = None) -> str:
        """Record an LLM call around fn(). fn must return the model's text output."""
        step = self._require_collector().begin_step("llm_call", model=model, prompt=prompt)
        t0 = time.perf_counter()
        out = fn()
        step.token_count = token_count
        self._collector.complete_step(step, str(out), (time.perf_counter() - t0) * 1000)
        return out

    def tool_call(self, name: str, arguments: dict, fn: Callable[[], Any]) -> Any:
        """Record a tool call around fn(). PRE_CALL guardrails (e.g. PII) fire
        BEFORE fn() runs — so a paused/denied call never executes the tool."""
        step = self._require_collector().begin_step(
            "tool_call", tool_name=name, tool_arguments=arguments)
        t0 = time.perf_counter()
        out = fn()
        self._collector.complete_step(step, str(out), (time.perf_counter() - t0) * 1000)
        return out

    def decision(self, output: str) -> str:
        """Record a final decision. PRE_DECISION guardrails fire on entry."""
        step = self._require_collector().begin_step("decision", output=output)
        self._collector.complete_step(step, output, 0.0)
        return output

    def _require_collector(self) -> TraceCollector:
        if self._collector is None:
            raise RuntimeError("Use these inside the AuditSession `with` block")
        return self._collector

    # ── Output ─────────────────────────────────────────────────────────────────

    def to_json(self, path: str) -> None:
        from glassbox.reporter.json_reporter import JsonReporter
        JsonReporter(self.trace, self.violations).write(path)

    def report(self, path: str, *, narrative: bool = True) -> None:
        from glassbox.reporter.pdf_reporter import PdfReporter
        PdfReporter(self.trace, self.violations, narrative=narrative).write(path)

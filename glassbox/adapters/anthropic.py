from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from glassbox.tracer import TraceCollector


class AnthropicAdapter:
    def __init__(self, collector: "TraceCollector") -> None:
        self._collector = collector
        self._orig: Any = None

    def activate(self) -> None:
        try:
            import anthropic
        except ImportError:
            return
        try:
            target = anthropic.resources.messages.Messages
        except AttributeError:
            return
        self._orig = target.create
        collector = self._collector

        def _wrapped(self_inner: Any, *args: Any, **kwargs: Any) -> Any:
            prompt = str(kwargs.get("messages", ""))
            model = kwargs.get("model")
            step = collector.begin_step("llm_call", model=model, prompt=prompt)
            t0 = time.perf_counter()
            result = self._orig(self_inner, *args, **kwargs)
            output = ""
            try:
                output = result.content[0].text
            except Exception:
                pass
            token_count = None
            try:
                token_count = result.usage.input_tokens + result.usage.output_tokens
            except Exception:
                pass
            step.token_count = token_count
            collector.complete_step(step, output, (time.perf_counter() - t0) * 1000)
            return result

        target.create = _wrapped  # type: ignore[method-assign]

    def deactivate(self) -> None:
        if self._orig is None:
            return
        try:
            import anthropic
            anthropic.resources.messages.Messages.create = self._orig  # type: ignore[method-assign]
        except (ImportError, AttributeError):
            pass
        self._orig = None

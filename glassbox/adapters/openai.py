from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from glassbox.tracer import TraceCollector


class OpenAIAdapter:
    def __init__(self, collector: "TraceCollector") -> None:
        self._collector = collector
        self._orig: Any = None

    def activate(self) -> None:
        try:
            import openai
        except ImportError:
            return
        self._orig = openai.chat.completions.create
        collector = self._collector

        def _wrapped(*args: Any, **kwargs: Any) -> Any:
            prompt = str(kwargs.get("messages", args[1] if len(args) > 1 else ""))
            model = kwargs.get("model", args[0] if args else None)
            step = collector.begin_step("llm_call", model=model, prompt=prompt)
            t0 = time.perf_counter()
            result = self._orig(*args, **kwargs)
            output = ""
            try:
                output = result.choices[0].message.content or ""
            except Exception:
                pass
            token_count = None
            try:
                token_count = result.usage.total_tokens
            except Exception:
                pass
            step.token_count = token_count
            collector.complete_step(step, output, (time.perf_counter() - t0) * 1000)
            return result

        openai.chat.completions.create = _wrapped  # type: ignore[method-assign]

    def deactivate(self) -> None:
        if self._orig is None:
            return
        try:
            import openai
            openai.chat.completions.create = self._orig  # type: ignore[method-assign]
        except ImportError:
            pass
        self._orig = None

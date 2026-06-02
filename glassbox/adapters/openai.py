from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from glassbox.tracer import TraceCollector


class OpenAIAdapter:
    """Intercepts OpenAI-compatible chat completions.

    Patches the class method ``Completions.create`` so it catches both the
    module-global client (``openai.chat.completions.create``) and instance
    clients (``client = OpenAI(base_url=...); client.chat.completions.create``).
    Instance clients with a custom ``base_url`` are how most OpenAI-compatible
    providers are used — Groq, Together, OpenRouter, Ollama, Azure, etc.
    """

    def __init__(self, collector: "TraceCollector") -> None:
        self._collector = collector
        self._orig: Any = None
        self._target: Any = None

    def activate(self) -> None:
        try:
            from openai.resources.chat.completions import Completions
        except ImportError:
            return
        self._target = Completions
        self._orig = Completions.create
        collector = self._collector
        orig = self._orig

        def _wrapped(inner_self, *args: Any, **kwargs: Any) -> Any:
            model = kwargs.get("model")
            prompt = str(kwargs.get("messages", ""))
            step = collector.begin_step("llm_call", model=model, prompt=prompt)
            t0 = time.perf_counter()
            result = orig(inner_self, *args, **kwargs)
            output, tokens = "", None
            try:
                output = result.choices[0].message.content or ""
            except Exception:
                pass
            try:
                tokens = result.usage.total_tokens
            except Exception:
                pass
            step.token_count = tokens
            collector.complete_step(step, output, (time.perf_counter() - t0) * 1000)
            return result

        Completions.create = _wrapped  # type: ignore[method-assign]

    def deactivate(self) -> None:
        if self._orig is None or self._target is None:
            return
        self._target.create = self._orig  # type: ignore[method-assign]
        self._orig = None
        self._target = None

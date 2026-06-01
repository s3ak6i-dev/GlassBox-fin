from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any, Optional

if TYPE_CHECKING:
    from glassbox.tracer import TraceCollector


class LlamaIndexAdapter:
    def __init__(self, collector: "TraceCollector") -> None:
        self._collector = collector
        self._handler: Any = None
        self._pending: dict[str, Any] = {}

    def activate(self) -> None:
        try:
            from llama_index.core.callbacks import BaseCallbackHandler, CBEventType
            from llama_index.core import Settings
        except ImportError:
            return

        collector = self._collector
        pending = self._pending

        class _GlassBoxLlamaHandler(BaseCallbackHandler):  # type: ignore[misc]
            def __init__(self) -> None:
                super().__init__(
                    event_starts_to_ignore=[],
                    event_ends_to_ignore=[],
                )

            def on_event_start(
                self,
                event_type: Any,
                payload: Optional[dict] = None,
                event_id: str = "",
                **kwargs: Any,
            ) -> str:
                payload = payload or {}
                if event_type == CBEventType.LLM:
                    messages = payload.get("messages", [])
                    prompt = str(messages)
                    model = payload.get("serialized", {}).get("model", None)
                    step = collector.begin_step("llm_call", model=model, prompt=prompt)
                    pending[event_id] = (step, time.perf_counter())
                elif event_type == CBEventType.FUNCTION_CALL:
                    tool_name = payload.get("tool", {}).get("name", "unknown")
                    args = payload.get("tool_input", {})
                    step = collector.begin_step(
                        "tool_call", tool_name=tool_name, tool_arguments=args
                    )
                    pending[event_id] = (step, time.perf_counter())
                return event_id

            def on_event_end(
                self,
                event_type: Any,
                payload: Optional[dict] = None,
                event_id: str = "",
                **kwargs: Any,
            ) -> None:
                payload = payload or {}
                if event_id not in pending:
                    return
                step, t0 = pending.pop(event_id)
                output = ""
                if event_type == CBEventType.LLM:
                    try:
                        output = payload.get("response", {}).message.content or ""
                    except Exception:
                        output = str(payload.get("response", ""))
                elif event_type == CBEventType.FUNCTION_CALL:
                    output = str(payload.get("tool_output", ""))
                collector.complete_step(step, output, (time.perf_counter() - t0) * 1000)

            def start_trace(self, trace_id: Optional[str] = None) -> None:
                pass

            def end_trace(
                self,
                trace_id: Optional[str] = None,
                trace_map: Optional[dict] = None,
            ) -> None:
                pass

        self._handler = _GlassBoxLlamaHandler()
        try:
            Settings.callback_manager.add_handler(self._handler)
        except Exception:
            pass

    def deactivate(self) -> None:
        if self._handler is None:
            return
        try:
            from llama_index.core import Settings
            Settings.callback_manager.remove_handler(self._handler)
        except Exception:
            pass
        self._handler = None

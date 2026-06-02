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
            from llama_index.core.callbacks.base_handler import BaseCallbackHandler
        except ImportError:
            try:
                from llama_index.core.callbacks import BaseCallbackHandler  # type: ignore[no-redef]
            except ImportError:
                return
        try:
            from llama_index.core.callbacks.schema import CBEventType
            from llama_index.core import Settings
        except ImportError:
            return

        collector = self._collector
        pending = self._pending

        def _text(payload: Optional[dict], *keys: str) -> str:
            payload = payload or {}
            for k in keys:
                if k in payload:
                    return str(payload[k])
            return ""

        class _GlassBoxLlamaHandler(BaseCallbackHandler):  # type: ignore[misc]
            def __init__(self) -> None:
                super().__init__(event_starts_to_ignore=[], event_ends_to_ignore=[])

            def on_event_start(self, event_type, payload=None, event_id="", parent_id="", **kwargs) -> str:
                payload = payload or {}
                if event_type == CBEventType.LLM:
                    model = (payload.get("serialized", {}) or {}).get("model") or \
                            (payload.get("serialized", {}) or {}).get("model_name")
                    step = collector.begin_step("llm_call", model=model,
                                                prompt=_text(payload, "messages", "formatted_prompt", "prompt"))
                    pending[event_id] = (step, time.perf_counter())
                elif event_type == CBEventType.FUNCTION_CALL:
                    tool = payload.get("tool")
                    tool_name = getattr(tool, "name", None) or "tool"
                    args = payload.get("function_call") or payload.get("tool_input") or {}
                    if not isinstance(args, dict):
                        args = {"input": str(args)}
                    step = collector.begin_step("tool_call", tool_name=tool_name, tool_arguments=args)
                    pending[event_id] = (step, time.perf_counter())
                return event_id

            def on_event_end(self, event_type, payload=None, event_id="", **kwargs) -> None:
                if event_id not in pending:
                    return
                step, t0 = pending.pop(event_id)
                payload = payload or {}
                output = _text(payload, "response", "function_call_response", "tool_output") or ""
                collector.complete_step(step, output, (time.perf_counter() - t0) * 1000)

            def start_trace(self, trace_id: Optional[str] = None) -> None:
                pass

            def end_trace(self, trace_id: Optional[str] = None, trace_map: Optional[dict] = None) -> None:
                pass

        self._handler = _GlassBoxLlamaHandler()
        Settings.callback_manager.add_handler(self._handler)

    def deactivate(self) -> None:
        if self._handler is None:
            return
        try:
            from llama_index.core import Settings
            Settings.callback_manager.remove_handler(self._handler)
        except Exception:
            pass
        self._handler = None

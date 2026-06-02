from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any, Optional
from uuid import UUID

if TYPE_CHECKING:
    from glassbox.tracer import TraceCollector


class LangChainAdapter:
    def __init__(self, collector: "TraceCollector") -> None:
        self._collector = collector
        self._handler: Any = None
        self.handler: Any = None   # public — pass via config={"callbacks": [...]}
        self._pending: dict[str, Any] = {}

    def activate(self) -> None:
        try:
            from langchain_core.callbacks import BaseCallbackHandler
        except ImportError:
            try:
                from langchain.callbacks.base import BaseCallbackHandler  # type: ignore[no-redef]
            except ImportError:
                return

        collector = self._collector
        pending = self._pending

        class _GlassBoxHandler(BaseCallbackHandler):  # type: ignore[misc]
            def _model_name(self, serialized: dict, kwargs: Any) -> str:
                params = kwargs.get("invocation_params") or {}
                return (params.get("model") or params.get("model_name")
                        or serialized.get("name")
                        or (serialized.get("id", [""])[-1] if serialized else None))

            def on_llm_start(
                self,
                serialized: dict,
                prompts: list[str],
                *,
                run_id: UUID,
                **kwargs: Any,
            ) -> None:
                step = collector.begin_step(
                    "llm_call",
                    model=self._model_name(serialized, kwargs),
                    prompt="\n".join(prompts),
                )
                pending[str(run_id)] = (step, time.perf_counter())

            def on_chat_model_start(
                self,
                serialized: dict,
                messages: list,
                *,
                run_id: UUID,
                **kwargs: Any,
            ) -> None:
                # messages is a list of message-lists; flatten to text
                flat = []
                for batch in messages:
                    for m in batch:
                        flat.append(getattr(m, "content", str(m)))
                step = collector.begin_step(
                    "llm_call",
                    model=self._model_name(serialized, kwargs),
                    prompt="\n".join(str(c) for c in flat),
                )
                pending[str(run_id)] = (step, time.perf_counter())

            def on_llm_end(self, response: Any, *, run_id: UUID, **kwargs: Any) -> None:
                key = str(run_id)
                if key not in pending:
                    return
                step, t0 = pending.pop(key)
                output = ""
                try:
                    output = response.generations[0][0].text
                except Exception:
                    pass
                collector.complete_step(step, output, (time.perf_counter() - t0) * 1000)

            def on_tool_start(
                self,
                serialized: dict,
                input_str: str,
                *,
                run_id: UUID,
                **kwargs: Any,
            ) -> None:
                tool_name = serialized.get("name", "unknown_tool")
                step = collector.begin_step(
                    "tool_call",
                    tool_name=tool_name,
                    tool_arguments={"input": input_str},
                )
                pending[str(run_id)] = (step, time.perf_counter())

            def on_tool_end(self, output: str, *, run_id: UUID, **kwargs: Any) -> None:
                key = str(run_id)
                if key not in pending:
                    return
                step, t0 = pending.pop(key)
                collector.complete_step(step, str(output), (time.perf_counter() - t0) * 1000)

        self._handler = _GlassBoxHandler()
        self.handler = self._handler
        # Best-effort global injection (works on some versions); the reliable
        # path is passing audit.callbacks into your agent's config.
        self._inject(self._handler)

    def _inject(self, handler: Any) -> None:
        try:
            from langchain_core.callbacks.manager import _configure
            import langchain_core.callbacks.manager as mgr
            if hasattr(mgr, "_callback_manager"):
                mgr._callback_manager.add_handler(handler, True)
                return
        except Exception:
            pass
        try:
            from langchain.callbacks import get_callback_manager  # type: ignore[import]
            get_callback_manager().add_handler(handler)
        except Exception:
            pass

    def deactivate(self) -> None:
        if self._handler is None:
            return
        try:
            import langchain_core.callbacks.manager as mgr
            if hasattr(mgr, "_callback_manager"):
                mgr._callback_manager.remove_handler(self._handler)
        except Exception:
            pass
        try:
            from langchain.callbacks import get_callback_manager  # type: ignore[import]
            get_callback_manager().remove_handler(self._handler)
        except Exception:
            pass
        self._handler = None

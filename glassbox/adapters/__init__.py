from __future__ import annotations

import sys
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from glassbox.tracer import TraceCollector

_FRAMEWORK_CHECKS = [
    ("openai",     "openai",      "glassbox.adapters.openai",     "OpenAIAdapter"),
    ("anthropic",  "anthropic",   "glassbox.adapters.anthropic",  "AnthropicAdapter"),
    ("langchain",  "langchain_core", "glassbox.adapters.langchain", "LangChainAdapter"),
    ("langchain",  "langchain",   "glassbox.adapters.langchain",  "LangChainAdapter"),
    ("llamaindex", "llama_index", "glassbox.adapters.llamaindex", "LlamaIndexAdapter"),
]


def detect_and_activate(collector: "TraceCollector") -> list:
    """Detect installed frameworks via sys.modules and activate matching adapters."""
    import importlib

    activated = []
    seen_adapters: set[str] = set()

    for _name, module_key, adapter_module, adapter_cls in _FRAMEWORK_CHECKS:
        if module_key not in sys.modules:
            continue
        adapter_key = adapter_module
        if adapter_key in seen_adapters:
            continue
        seen_adapters.add(adapter_key)
        try:
            mod = importlib.import_module(adapter_module)
            cls = getattr(mod, adapter_cls)
            adapter = cls(collector)
            adapter.activate()
            activated.append(adapter)
        except Exception:
            pass

    return activated

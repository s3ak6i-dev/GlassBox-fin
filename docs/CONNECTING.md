# Connecting agents to glassbox

Every way to get an agent's traces, violations, and guardrails into glassbox —
whether you're using the Python library standalone or the dashboard platform.

- [1. From the app (dashboard)](#1-from-the-app-dashboard)
- [2. From the library (Python)](#2-from-the-library-python)
- [3. Per-framework setup](#3-per-framework-setup)
- [4. Multi-agent topologies](#4-multi-agent-topologies)
- [5. Runnable examples](#5-runnable-examples)

---

## 1. From the app (dashboard)

The dashboard is the control plane. To put an agent under watch:

1. **Sign up / log in** at `http://localhost:5173`.
2. **Onboarding wizard** (first run) walks you through org → vendors → first
   agent → ruleset → go-live. Registering an agent mints an **instrumentation
   key**.
3. Already onboarded? **Settings ▸ API Keys** (or **Agents ▸ Register agent**)
   to create agents and reveal/copy their keys.
4. Drop the key into your agent (see below). Traces stream to **Trace Explorer**
   live; `pause` guardrails appear in **Hold Inbox** for approval.

The key is all the platform needs — no other dashboard config is required to
start ingesting.

---

## 2. From the library (Python)

```bash
pip install glassbox-fin
```

**Standalone** (local files, your own approver) — no platform required:

```python
from glassbox import AuditSession, rules, GuardrailPolicy

with AuditSession(
    name="loan_decision_42",
    rules=[rules.PII(), rules.DTIRationale(), rules.Jurisdiction("EU")],
    jurisdiction="EU",
    guardrails=GuardrailPolicy(on_critical="pause", approver=my_approver),
) as audit:
    result = agent.run(task)

audit.to_json("trace.json")        # tamper-evident JSON
audit.report("compliance.pdf")     # PDF
```

**Connected to the platform** — add `instrumentation_key`; traces stream to the
dashboard and `pause` holds are resolved there (no local `approver` needed):

```python
with AuditSession(
    instrumentation_key="<key from dashboard>",
    api_url="http://localhost:8000",     # your backend
    rules=[rules.PII(), rules.DTIRationale()],
    guardrails=GuardrailPolicy(on_critical="pause"),
) as audit:
    result = agent.run(task)
```

Everything else is identical — connecting to the platform is one extra argument.

---

## 3. Per-framework setup

The SDK wraps each framework through its **native** instrumentation, so your
agent code is unchanged.

| Framework | What's captured | Wiring |
|---|---|---|
| **OpenAI / Anthropic** | LLM calls | **Automatic** — SDK client patched at class level |
| **Groq / Together / OpenRouter / Ollama / Azure** | LLM calls | **Automatic** — they use the OpenAI client with a custom `base_url`, which is captured |
| **LlamaIndex** | LLM + tool events | **Automatic** — registered on `Settings.callback_manager` |
| **LangChain / LangGraph** | chat-model + tool calls | Pass the handler: `executor.invoke(x, config={"callbacks": audit.callbacks})` |

### OpenAI-compatible (incl. all free providers)

```python
from openai import OpenAI
from glassbox import AuditSession, rules

client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_KEY)
with AuditSession(instrumentation_key=KEY, rules=[rules.PII()]) as audit:
    client.chat.completions.create(model="llama-3.1-8b-instant",
                                   messages=[{"role": "user", "content": "..."}])
```

### LangChain / LangGraph

```python
from glassbox import AuditSession, rules, GuardrailPolicy

with AuditSession(instrumentation_key=KEY, rules=[rules.PII()],
                  guardrails=GuardrailPolicy(on_critical="pause")) as audit:
    executor.invoke({"input": task}, config={"callbacks": audit.callbacks})
```

`audit.callbacks` returns the LangChain handler(s) for the session. (Modern
LangChain attaches callbacks per-invocation, which is why this is explicit.)

### LlamaIndex

```python
from glassbox import AuditSession, rules
with AuditSession(instrumentation_key=KEY, rules=[rules.PII()]) as audit:
    llm.complete("...")        # captured automatically
```

---

## 4. Multi-agent topologies

For supervisor → sub-agent systems, register children under the parent so the
**Fleet graph draws delegation edges**:

```python
from glassbox import AuditSession, rules
from glassbox.platform import spawn_subagent

fraud_key  = spawn_subagent(SUPERVISOR_KEY, "fraud-check")
credit_key = spawn_subagent(SUPERVISOR_KEY, "credit-scoring")

with AuditSession(instrumentation_key=fraud_key, rules=[rules.PII()]) as audit:
    ...   # this sub-agent's calls, traced under its own node
```

Each child appears as its own agent node, wired to the supervisor by a dashed
delegation arrow and to whatever vendors it calls. Works with LangGraph, CrewAI,
or plain Python orchestration.

---

## 5. Runnable examples

| File | Shows |
|---|---|
| [`examples/free_agent.py`](../examples/free_agent.py) | Minimal raw agent on a free LLM (Groq/Ollama) |
| [`examples/langchain_agent.py`](../examples/langchain_agent.py) | LangChain tool agent → **pause → approve** in the Hold Inbox |
| [`examples/llamaindex_agent.py`](../examples/llamaindex_agent.py) | LlamaIndex (zero-wiring auto-capture) |
| [`examples/multi_agent.py`](../examples/multi_agent.py) | Supervisor + sub-agents → **delegation topology** in the Fleet graph |

Full walkthrough: [`examples/README.md`](../examples/README.md).

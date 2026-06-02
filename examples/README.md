# Deploy a free agent on glassbox

A 5-minute walkthrough: run a real, free LLM agent and watch its compliance
trace appear live in your dashboard.

## Prerequisites

Your platform running locally:

```bash
docker compose up -d                                   # or point .env at Neon
uvicorn app.backend.main:app --reload                  # backend :8000
cd app/frontend && npm run dev                         # dashboard :5173
```

## 1 · Get an instrumentation key

In the dashboard (`http://localhost:5173`):
**Settings ▸ API Keys** → reveal & copy any agent's key (or register a new agent).

## 2 · Pick a free LLM

| Provider | Cost | Setup |
|---|---|---|
| **Groq** | Free tier | Get a key at <https://console.groq.com/keys> |
| **Ollama** | Free, fully local | Install <https://ollama.com>, then `ollama pull llama3.2` |

## 3 · Set env vars & run

```bash
pip install openai            # the SDK auto-detects and wraps it

# Windows PowerShell
$env:GLASSBOX_KEY="<your-instrumentation-key>"
$env:GROQ_API_KEY="gsk_..."            # OR: $env:GLASSBOX_PROVIDER="ollama"

python examples/free_agent.py
```

```bash
# macOS / Linux
export GLASSBOX_KEY="<your-instrumentation-key>"
export GROQ_API_KEY="gsk_..."          # OR: export GLASSBOX_PROVIDER=ollama

python examples/free_agent.py
```

## 4 · Watch it land

- **Trace Explorer** — the new trace appears within a second (live via SSE)
- **Trace Detail** — every LLM call, hash-chained; **Export PDF** for the receipt
- **Spend** — token cost attributed to your provider
- **Fleet** — your agent node lights up, wired to the vendor hexagon
- **Violations** — if the underwriter skipped debt-to-income reasoning,
  `MISSING_DTI_RATIONALE` shows up

## The pause → approve flow (LangChain)

[`langchain_agent.py`](langchain_agent.py) is a real LangChain tool-calling
agent. Because it uses a **tool**, the CRITICAL `PII` rule can fire at the call
boundary — so when the agent tries to pass the applicant's national ID into the
notify tool, it **pauses and waits** for you to approve from the Hold Inbox.

```bash
pip install langchain langchain-openai
$env:GROQ_API_KEY="gsk_..."            # tool-calling model (llama-3.3-70b)
$env:GLASSBOX_KEY="<instrumentation-key>"
python examples/langchain_agent.py
```

The agent prints "…it will pause…" and blocks. Open **Holds** in the dashboard,
click **Approve**, and the agent resumes; click **Deny** and it's halted.

### How the integration works

glassbox wraps frameworks through their native callback/event systems:

| Framework | Mechanism |
|---|---|
| **LangChain** | a `BaseCallbackHandler` (captures `on_chat_model_start`, `on_tool_start`, …). Pass it explicitly: `executor.invoke(x, config={"callbacks": audit.callbacks})` |
| **LlamaIndex** | registered on the global `Settings.callback_manager` — captured automatically, no wiring needed |
| **OpenAI / Anthropic / Groq / Ollama** | the SDK client is patched at the class level — captured automatically |

`audit.callbacks` exposes the LangChain handler(s) for the active session.

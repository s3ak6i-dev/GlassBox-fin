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

## Want the pause → approve flow?

The raw agent above only emits LLM calls, so the CRITICAL `PII` rule (which
guards *tool* arguments) can't fire. To see an agent literally pause and wait
for your sign-off in the **Hold Inbox**, use a framework with tools (LangChain)
and pass a tool call carrying PII — or just open the pre-seeded hold already in
your dashboard. Ask and we'll drop in a LangChain example.

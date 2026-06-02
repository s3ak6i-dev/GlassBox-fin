# glassbox-fin

**Real-time compliance guardrails, audit trails, and decision lineage for financial LLM agents.**

glassbox-fin is two things:

1. **An open-source Python library** — wrap any agent (LangChain, LlamaIndex, raw OpenAI/Anthropic) in an `AuditSession` and every LLM call and tool invocation is traced, hash-chained, and checked against financial-compliance rules in real time.
2. **A SaaS control plane** — register your agents, watch traces stream live, approve paused executions from a Hold Inbox, explore your fleet's compliance topology, track LLM spend, and generate audit-ready PDF reports.

---

## The library

```bash
pip install glassbox-fin
```

```python
from glassbox import AuditSession, rules, GuardrailPolicy

policy = GuardrailPolicy(on_critical="pause", approver=your_approver)

with AuditSession(
    name="loan_decision_42",
    rules=[rules.PII(), rules.DTIRationale(), rules.Jurisdiction("EU")],
    jurisdiction="EU",
    guardrails=policy,
) as audit:
    result = agent.run(application)

audit.to_json("trace.json")        # tamper-evident JSON trail
audit.report("compliance.pdf")     # human-readable PDF
```

**8 built-in rules** mapped to GDPR, EU AI Act, MiFID II, EBA, and Basel III.
**Guardrail engine**: per-severity `pause` / `raise` / `log`. On `pause`, the agent
blocks at the call boundary until a human approves. **SHA-256 hash chain** on every
step makes trails tamper-evident.

Connect to the platform by adding one argument:

```python
with AuditSession(instrumentation_key="gbx_live_...", ...) as audit:
    ...
```

Traces stream to your dashboard live, and `pause` holds are resolved from the Hold Inbox.

### 📑 Connecting agents

**[docs/CONNECTING.md](docs/CONNECTING.md)** is the complete guide — every way to
wire an agent in, from the app and from the library, for each framework
(OpenAI · Anthropic · Groq · Ollama · LangChain · LangGraph · LlamaIndex) plus
multi-agent topologies. Runnable [examples](examples/) included.

---

## The platform (`app/`)

| Layer | Stack |
|---|---|
| Frontend | React 18 + Vite + D3 (force-directed fleet graph) |
| Backend | FastAPI + async SQLAlchemy + PostgreSQL |
| Realtime | Server-Sent Events (live traces, holds) |

**Screens:** Onboarding wizard · Overview · Trace Explorer · Trace Detail (terminal +
hash-chain) · Hold Inbox (real-time approval) · Violation Center · Fleet topology graph ·
Agent Registry · Spend Dashboard · Rule Manager · Compliance Reports · Settings.

### Run it locally

```bash
# 1. Database (or point DATABASE_URL at Neon / any Postgres)
docker compose up -d

# 2. Backend
pip install -r app/backend/requirements.txt
# create app/backend/.env with DATABASE_URL + SECRET_KEY
uvicorn app.backend.main:app --reload

# 3. Frontend
cd app/frontend && npm install && npm run dev
```

Dashboard at `http://localhost:5173`, API at `http://localhost:8000` (docs at `/docs`).

---

Apache 2.0 license.

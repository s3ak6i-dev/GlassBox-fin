# glassbox·fin — Go-To-Market Strategy

> Open-core compliance infrastructure for financial AI agents. Free library wins
> the developer; the hosted control plane sells to compliance. Vertical depth +
> regulatory trust + audit-trail retention = the moat.

---

## 0. The strategy in one line
**Land bottom-up with a free, best-in-class open-source library that developers
adopt in minutes; expand top-down into compliance/risk teams who pay for hosted
retention, audit-readiness, and human-in-the-loop control.** Win the regulated
vertical (financial AI) that horizontal LLM-observability tools don't serve.

---

## 1. POSITIONING

### Category
Don't fight in **"LLM observability"** — it's crowded (LangSmith, Langfuse, Arize
Phoenix, Helicone, Braintrust) and developer-budget. Create/own:

> **Compliance & audit infrastructure for financial AI agents.**

Observability answers *"is my agent working?"* glassbox answers *"can you prove,
to a regulator, what it did — and stop it in real time when it's about to break a
rule?"* Different buyer, different budget (risk/compliance, not eng tooling).

### One-liner
**"Real-time guardrails and tamper-evident audit trails for financial LLM agents."**

### Elevator
*AI agents are starting to make regulated financial decisions — loan approvals,
KYC, trades, payouts. glassbox sits in the agent's loop: it enforces compliance
rules in real time (pausing risky actions for human approval), and records every
step in a tamper-evident, hash-chained audit trail that turns into an
AI-Act/MiFID-II-ready report. Black box → glass box.*

### Why now (the wedge)
- **Agentic AI is moving into regulated decisions** in 2025–2026.
- **EU AI Act** phasing in (high-risk obligations, logging/traceability, human
  oversight) through 2026–2027 — a hard deadline that creates budget.
- **MiFID II / SR 11-7 / GDPR Art. 22** already demand auditability and
  record-keeping that current AI stacks can't produce.
- Compliance teams are being asked to sign off on AI they can't see. We make it
  visible.

### Against alternatives
| They have | We win because |
|---|---|
| LangSmith / Langfuse / Arize (observability) | We're **compliance**, not debugging: real-time guardrails + tamper-evidence + regulatory reports, sold to risk teams. |
| Guardrails-AI / NeMo Guardrails (OSS guardrails) | We add the **audit trail + hash-chain integrity + hosted control plane + holds inbox** — the *proof* layer, plus a product, not just a library. |
| GRC platforms (OneTrust, etc.) | We're **AI-native and in-the-loop**, not a questionnaire after the fact. |
| Build-it-yourself | Open-source, drop-in adapters (OpenAI/Anthropic/LangChain/LlamaIndex), days not quarters. |

---

## 2. ICP & THE BUYING COMMITTEE

### Ideal Customer Profile (initial beachhead)
- **Segment:** mid-market **fintech / financial services** building or deploying
  LLM agents in regulated workflows (lending, KYC/AML, underwriting, wealth,
  payments, insurance).
- **Firmographics:** 50–1,000 employees, has a compliance function, EU/UK
  exposure (AI Act pressure) or US financial regulation. Already shipping AI to
  prod or piloting agents.
- **Not yet:** giant banks (12–18mo cycles, start later via design partners) or
  hobbyists (no budget).

### The committee (sell to all three)
- **User / champion — AI/ML or platform engineer.** Adopts the free library +
  CLI. Cares about: easy integration, no perf hit, not rebuilding audit infra.
- **Economic buyer — Head of Compliance / Risk / CISO.** Signs the contract.
  Cares about: audit-readiness, regulator defensibility, retention, oversight.
- **Influencer — Eng leadership / VP Eng.** Cares about: ship velocity, vendor
  consolidation, not getting blocked by compliance.

**The pitch translates per persona:** engineer ("3 lines, all frameworks") →
compliance ("AI-Act-ready evidence, 7-yr retention, human approval") → eng lead
("unblock AI launches without building compliance yourself").

---

## 3. THE MOTION — two-sided, land & expand

```
        DEVELOPER (bottom-up, PLG)              COMPLIANCE (top-down, sales-assist)
        ───────────────────────────            ──────────────────────────────────
  pip install glassbox-fin  ──►  free traces   ──►  "we need retention + a hold
  GitHub stars / docs / CLI       in dashboard       inbox + AI-Act reports"
        │                            │                        │
        └──────── PRODUCT-QUALIFIED LEAD ───────►  sales-assisted Business/Enterprise
```

- **Land:** developer self-serves the OSS library + free hosted tier. Activation
  = first trace visible in the dashboard.
- **Trigger:** retention limit, a pending hold needing a reviewer seat, or a
  compliance review forces the upgrade conversation.
- **Expand:** more agents, longer retention, more seats, SSO, self-host → Business
  → Enterprise. Net revenue retention via #agents + retention tier.

---

## 4. PRICING (recap — see pricing notes)
Open-core. Library/CLI free forever. Hosted tiers gated primarily by **# agents +
retention** (retention is the compliance lever regulated firms *must* pay for):

| Community $0 | Team ~$199/mo | Business ~$999/mo | Enterprise (custom, $25–100k+/yr) |
|---|---|---|---|
| 1 agent, 30-day retention | ~5 agents, 90-day | ~25 agents, 1-yr, SSO | unlimited, 7-yr, self-host, DPA/BAA, SLA |

Annual contracts (2 months free) for Business/Enterprise. Add-ons: extra
retention, volume overage, pro-services (custom reports/integration). High gross
margin — you don't pay for customers' LLM calls.

---

## 5. CHANNELS

### Reaching developers (top of funnel)
- **GitHub** — the repo *is* the landing page. README, badges, quickstart,
  examples, stars. Issues/Discussions as community.
- **PyPI** — discoverability via keywords/classifiers; `pip install glassbox-fin`.
- **Show HN / Hacker News** launch (OSS angle: "tamper-evident audit trails for
  AI agents"). r/MachineLearning, r/LocalLLaMA, Lobsters.
- **Framework ecosystems** — be the compliance integration for **LangChain,
  LlamaIndex, OpenAI Agents SDK**: docs, example repos, integration listings.
- **Content/SEO** — "EU AI Act for AI engineers", "how to audit an LLM agent",
  "MiFID II + AI", comparison pages (vs LangSmith for compliance). Dev.to,
  Medium, your blog.
- **Dev communities / Discords / X** — build in public; founder posting demos
  (the launch film, the CLI banner).

### Reaching compliance buyers (expansion / enterprise)
- **LinkedIn** — founder + content aimed at Heads of Compliance/Risk; AI Act
  explainer content; "AI governance" thought leadership.
- **Regulatory-moment content** — webinars/guides timed to AI Act milestones.
- **Events** — fintech (Money20/20, Fintech Meetup), AI governance / RegTech
  conferences, GRC meetups.
- **Partnerships** — GRC vendors, fintech infra (banking-as-a-service), SIs/
  consultancies advising on AI Act, cloud marketplaces (AWS/Azure) for procurement.

---

## 6. CONTENT / DEVREL ENGINE (the flywheel)
OSS adoption → stars/trust → content → more adoption → PQLs → revenue → fund more.

- **Docs as product** — flawless quickstart, every framework, copy-paste examples
  (you already have `examples/` + `docs/CONNECTING.md`). Time-to-first-trace < 5 min.
- **The "AI Act compliance" content pillar** — own this SEO/topic. Practical, for
  engineers *and* compliance.
- **Comparison/"alternative to" pages** — capture observability searchers looking
  for compliance.
- **Launch film** (in production) — hero asset for the site, Show HN, social.
- **Open artifacts** — a public "compliance rules catalog", a sample audit report,
  a hash-chain explainer. Trust through transparency (on-brand).
- **Founder-led** — build in public; the CLI/film are demo-able moments.

---

## 7. LAUNCH SEQUENCE (phased)

### Phase 0 — Harden & deploy (now, ~1–2 wks)
Finish the 🔴 ops list (rate limiting, Sentry/logging, real deploy, alembic
stamp). Get it live + observable. **Don't launch publicly until it's deployed and
monitored.**

### Phase 1 — Design partners (weeks 2–6)
- Recruit **3–5 design partners** (fintechs shipping AI). Free Business tier +
  white-glove onboarding in exchange for feedback, a logo, and a quote/case study.
- Goal: prove activation, fix the rough edges real users hit, get 1–2 testimonials.

### Phase 2 — Open-source launch (weeks 6–10)
- **Show HN + Product Hunt**, repo polished, README + film + live demo.
- Framework integration posts; dev community seeding; founder content blitz.
- Goal: GitHub stars, PyPI installs, first wave of self-serve signups, inbound.

### Phase 3 — SaaS GA + monetization (months 3–4)
- Public pricing live; self-serve Team/Business checkout; sales-assist for larger.
- Convert design partners + PQLs to paid. First case studies published.
- Goal: first $ ARR, repeatable activation→paid funnel.

### Phase 4 — Enterprise + compliance motion (months 4–9)
- SSO/SCIM, self-host/VPC, DPA/BAA, SLA. Compliance-buyer content + events +
  partnerships. Land larger logos. AI-Act deadline as the forcing function.

---

## 8. SALES MOTION
- **Self-serve** (Community/Team): credit-card, no human. PLG funnel does the work.
- **Sales-assisted** (Business): triggered by PQL signals (multiple agents, hold
  usage, retention-limit hits) → founder/AE reaches out. Demo = the live hold
  inbox + a generated AI-Act report.
- **Enterprise:** security review, self-host, procurement; ROI framed against the
  **cost of a compliance failure** (fines, failed audit, blocked AI launch), not
  server cost. Annual, land-and-expand.

---

## 9. PARTNERSHIPS / ECOSYSTEM
- **Agent frameworks** (LangChain, LlamaIndex, OpenAI Agents SDK) — be the
  compliance/audit integration; co-marketing, listings.
- **LLM vendors** — "compliance-ready" integration story.
- **GRC / RegTech** — complement, not compete; integration into their workflows.
- **SIs & AI-Act consultancies** — they need a tool to recommend; you need their
  enterprise access. Referral/partner program.
- **Cloud marketplaces** — AWS/Azure/GCP for enterprise procurement + co-sell.

---

## 10. METRICS & FUNNEL
- **North Star:** weekly **traces ingested from paying workspaces** (usage = value
  realized).
- **PLG funnel:** PyPI installs / GitHub stars → signups → **activation (first
  trace in dashboard)** → habit (traces/wk) → PQL → paid → expansion (NRR).
- **Leading indicators:** time-to-first-trace, % signups activated, # agents/
  account, hold-inbox usage, retention-limit hits (upgrade pressure).
- **Revenue:** paid logos, ARR, NRR > 110%, CAC payback, OSS→paid conversion.
- **Community:** stars, contributors, Discord/issues activity.

---

## 11. MOAT / DEFENSIBILITY
1. **Vertical depth** — financial-compliance rules, regulatory mappings, reports
   horizontal tools won't build.
2. **Audit-trail lock-in (positive)** — once your years of tamper-evident
   compliance evidence live here, switching is unthinkable. Retention = stickiness.
3. **Regulatory trust** — being the recognized standard auditors/regulators accept.
4. **Open-source community** — adoption, contributions, integrations, mindshare.
5. **Two-sided wedge** — developers + compliance both bought in; hard to displace.

---

## 12. 90-DAY EXECUTION PLAN (aligned with the build)
- **Days 1–14:** 🔴 hardening + deploy + monitoring; publish to **real PyPI**
  (version bump); polish README/docs; finish the launch film.
- **Days 15–45:** recruit 3–5 **design partners**; tighten onboarding to
  <5-min activation; collect quotes; build the AI-Act content pillar (3–4 pieces).
- **Days 45–70:** **Show HN + Product Hunt** OSS launch; framework integration
  posts; founder content; capture inbound.
- **Days 70–90:** turn on **paid tiers + self-serve checkout**; convert design
  partners + PQLs; ship 1–2 **case studies**; start the compliance-buyer motion.

---

## 13. RISKS & ANTI-PATTERNS
- **Don't position as observability** — you'll be commoditized and out-funded.
  Stay in compliance/regulated.
- **Don't launch before deploy + monitoring** — a broken Show HN is a wasted shot.
- **Don't make the free tier usable by a real regulated firm** — 30-day retention
  self-selects buyers (you can't keep AI-Act evidence in a 30-day window).
- **Don't usage-meter as the headline** — regulated buyers want predictable bills.
- **Don't ignore the compliance buyer** — engineers adopt, but compliance pays;
  build content/proof for them early.
- **Trust is the product** — a security or data incident is existential for a
  compliance vendor. Hardening (the 🔴 list) is GTM, not just ops.

---

*Companion: pricing structure (open-core, agents+retention), `docs/DEPLOY.md`,
`docs/CONNECTING.md`, and the launch film in `video/`.*

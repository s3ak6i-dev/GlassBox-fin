# glassbox — Roadmap: unified funnel & personalized entry

The work to turn the standalone marketing page + the dashboard into **one
continuous product**: visit → sign up → warm welcome → operate.

## Decisions locked

1. **Option 2** — the marketing landing becomes part of the React app (the
   public `/` route). One SPA, one origin, one deploy, shared design system.
2. **Separate Home route** — a personalized post-login surface, distinct from
   the operational Overview.
3. **Dedicated login/signup pages** (not a modal) — already exist.
4. This roadmap doc is the working source of truth.

---

## Target route structure

Public (no auth):
```
/            → Landing (ported marketing page)
/login       → Login
/signup      → Signup
```
Authenticated product (nested under /app):
```
/onboarding  → 5-step wizard (existing)
/app         → Home  (NEW — personalized landing pad)
/app/overview, /app/traces, /app/traces/:id, /app/holds, /app/violations,
/app/fleets, /app/agents, /app/spend, /app/rules, /app/reports,
/app/docs, /app/settings
```
Flow: Landing `/` → Get started → `/signup` → onboarding → **`/app` (Home)**.
Login success → `/app`. A logged-in visitor hitting `/` sees the landing with
an "Open dashboard" button.

> Note: this moves dashboard routes from top-level to `/app/*` — a contained
> refactor of `App.jsx` routes + `Sidebar` links. The Docs snippets use
> `location.origin`, so they're unaffected.

---

## Phases (smallest-risk-first)

### Phase 1 — Landing FAQ + content  *(independent, no architecture change)*
Add to the existing marketing page before porting:
- **FAQ** section (accordion): data residency, does the agent run on our
  servers (no — your infra), supported frameworks, free vs paid, EU AI Act,
  self-host vs cloud.
- Tighten CTAs to point at the funnel (placeholder until Phase 3).

### Phase 2 — Port landing into the React app  *(the big one)*
- New `pages/Landing.jsx` + `landing.css` (reuse the existing `glassbox.css`
  tokens/structure).
- **Pragmatic strategy:** reproduce the markup as JSX, then run the existing
  vanilla-JS behaviour (cube/voxel, scroll-reveal, terminal stream, the
  how-it-works demos, rules filter) from a single `useEffect` mount hook — the
  script targets elements by id/class that the JSX already provides, so most of
  it ports with little rewrite.
- Mount at `/`; keep `/login` `/signup`.
- Risk: the 3D/interactive JS is the bulk of the effort; budget for it.

### Phase 3 — Front door auth wiring
- Landing nav + hero: **Sign in** → `/login`, **Get started** → `/signup`.
- Logged-in state on landing → **Open dashboard** → `/app`.
- Refactor authed routes under `/app/*`; update `Sidebar` links, redirects,
  route guards (`RequireAuth`, `RequireOnboarding`).

### Phase 4 — Personalized Home + loaders
- `pages/Home.jsx` at `/app` — **orient & route, not monitor**:
  - time-aware greeting ("Good evening, Surya")
  - one-line status ("All quiet" / "1 hold needs you")
  - action-first callouts: pending holds, criticals since last visit
  - quick actions: Connect an agent · View traces · Generate report
  - "since you were last here" delta (track last-seen timestamp)
- Branded **loader / transition** on login → Home (replace bare spinner;
  "Spinning up your workspace…").
- Keep **Overview** as the dense operational screen at `/app/overview`.

### Phase 5 — "What's this?" inline hints
- Small `(?)` affordance per screen → a popover explaining that screen and its
  key columns/actions. Lighter than the full tour; complements it.
- Reuse the tour's tooltip styling; store dismissals in localStorage.

---

## Home screen — content spec (Phase 4 detail)

| Block | Content |
|---|---|
| Greeting | "Good {morning/afternoon/evening}, {first name}." |
| Status line | Derived: holds pending? criticals today? else "Everything's quiet." |
| Needs you | Cards only when non-zero: N holds awaiting approval → Hold Inbox; N new critical violations → Violations |
| Since last visit | New traces, new violations since `last_seen` |
| Quick actions | Connect an agent · Trace Explorer · Generate report |
| Footer nudge | If 0 agents: "Connect your first agent" CTA |

Backend: a `/api/stats/home` endpoint (greeting deltas + last-seen) or reuse
`/api/stats/overview` + a stored `users.last_seen_at`.

---

## FAQ — content outline (Phase 1 detail)

- **Does my agent run on your servers?** No — it runs in your infra; glassbox
  observes and governs it via the instrumentation key.
- **Is my data safe?** PII is redacted before storage by default; traces are
  hash-chained and tamper-evident; self-host option.
- **Which frameworks?** OpenAI, Anthropic, Groq/Ollama, LangChain, LangGraph,
  LlamaIndex — plus a manual API for custom agents.
- **Is it free?** The library is open source (Apache 2.0); the platform has a
  free tier.
- **Why does this exist?** EU AI Act high-risk provisions (2026) require audit
  trails + human oversight for credit/fraud AI.
- **Can I run it myself?** Yes — one Docker image, point it at any Postgres.

---

## Out of scope (later)

- Horizontal scaling of the SSE bus (needs Redis pub/sub).
- PyPI publish + `PUBLISHING.md`.
- Billing/plans UI.
- Multi-workspace switcher UI.

---

## Status

- [ ] Phase 1 — Landing FAQ + content
- [ ] Phase 2 — Port landing into React (`/`)
- [ ] Phase 3 — Front-door auth wiring + `/app/*` refactor
- [ ] Phase 4 — Personalized Home + loaders
- [ ] Phase 5 — "What's this?" inline hints

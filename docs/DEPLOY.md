# Deploying glassbox

The dashboard + API ship as **one Docker image**: a Node stage builds the React
frontend, and the FastAPI backend serves both the API and that built SPA from a
single origin. Point it at your Neon database and it's live.

> **One instance only.** The live-updates event bus (SSE for traces & holds) is
> in-process. Run a single instance/worker. Horizontal scaling needs a shared
> broker (Redis pub/sub) — a known v1.1 item.

---

## Option A — Render (blueprint, ~5 min)

1. Push the repo to GitHub (already done).
2. Render ▸ **New ▸ Blueprint** ▸ select this repo. It reads [`render.yaml`](../render.yaml).
3. Set **`DATABASE_URL`** to your Neon connection string (the one in your local
   `.env` works). `SECRET_KEY` is auto-generated.
4. Deploy. Health check is `/api/health`; the dashboard is the service root URL.

Use a plan with an always-on instance (not the sleeping free tier) so SSE
connections stay open.

## Option B — Railway

1. Railway ▸ **New Project ▸ Deploy from GitHub repo**. It detects the
   `Dockerfile` ([`railway.json`](../railway.json) sets the health check).
2. Add variables: `DATABASE_URL`, `SECRET_KEY`.
3. Deploy. Railway injects `PORT`; the container already binds `0.0.0.0:$PORT`.

## Option C — any Docker host (Fly.io, a VPS, etc.)

```bash
docker build -t glassbox .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://…neon…?sslmode=require" \
  -e SECRET_KEY="$(openssl rand -hex 32)" \
  glassbox
```
Open `http://localhost:8000`.

---

## Environment variables

| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon/Postgres URL. Driver + SSL are normalised automatically. |
| `SECRET_KEY` | ✅ | Long random string for signing JWTs. |
| `ACCESS_TOKEN_EXPIRE_DAYS` | — | Default `7`. |
| `CORS_ORIGINS` | — | `*` for same-origin serving; list frontend origins if you split hosts. |
| `PORT` | — | Injected by the host; container binds it. |
| `GOOGLE_CLIENT_ID` | — | Enables "Sign in with Google". |
| `SENTRY_DSN` | — | Enables error tracking. Leave unset to disable. |
| `ENVIRONMENT` | — | `production` / `staging` — tags Sentry + logs. |
| `LOG_LEVEL` | — | Default `INFO`. Logs are structured JSON on stdout. |
| `RATE_LIMIT_ENABLED` | — | Default `true`. Auth = 10/min/IP, ingest = 240/min/key. |

See [`app/backend/.env.production.example`](../app/backend/.env.production.example).

## Production hardening (built in)
- **Rate limiting** (slowapi): auth endpoints throttled per IP, ingest per
  instrumentation key — a leaked key can't write unbounded traces. In-memory per
  process (fine for the single-worker SSE setup); move to Redis when scaling out.
- **Error tracking**: set `SENTRY_DSN` and exceptions report automatically.
- **Structured logging**: every `/api/*` request logs as JSON (method, path,
  status, ms) to stdout — ready for any log aggregator.

The schema is created automatically on first boot (`create_all`), so a fresh
Neon database boots with no extra steps.

**Evolving the schema after launch** is managed with Alembic — see
[`app/backend/migrations/README.md`](../app/backend/migrations/README.md). On an
existing database, run `alembic stamp head` once to adopt migration tracking;
thereafter use `alembic revision --autogenerate` + `alembic upgrade head`
instead of manual `ALTER`s.

---

## After it's live

1. Open the service URL → sign up → onboarding wizard.
2. **Settings ▸ API Keys** → copy a key.
3. Point an agent at it — set `api_url` to your deployed URL:
   ```python
   AuditSession(instrumentation_key="…", api_url="https://your-app.onrender.com", …)
   ```
4. Traces stream into the live dashboard. See [CONNECTING.md](CONNECTING.md).

---

## Split deploy (optional)

To host the frontend separately (e.g. Vercel) from the backend:

- **Frontend**: build with `VITE_API_URL=https://your-backend` set, deploy
  `app/frontend/dist` as static.
- **Backend**: set `CORS_ORIGINS` to the frontend's origin.

The single-origin image above is simpler and recommended for a first deploy.

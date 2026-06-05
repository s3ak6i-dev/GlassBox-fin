import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.backend.config import settings
from app.backend.db import create_all_tables
from app.backend.observability import init_sentry, log_event, logger, setup_logging
from app.backend.ratelimit import limiter
from app.backend.routers import (
    auth, orgs, workspaces, fleets, agents, ingest, holds, vendors, rulesets,
    traces, stats, violations, graph, spend, reports
)

setup_logging()
init_sentry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_all_tables()
    logger.info("glassbox API started")
    yield


app = FastAPI(title="glassbox API", version="0.1.0", lifespan=lifespan)

# Rate limiting (slowapi) — see app/backend/ratelimit.py for limits.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    t0 = time.perf_counter()
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        log_event(
            "request",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            ms=round((time.perf_counter() - t0) * 1000, 1),
        )
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    # Auth is via Authorization: Bearer headers, not cookies — so credentials
    # are not needed, which keeps a wildcard origin valid and safe.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(orgs.router)
app.include_router(workspaces.router)
app.include_router(fleets.router)
app.include_router(agents.router)
app.include_router(ingest.router)
app.include_router(holds.router)
app.include_router(vendors.router)
app.include_router(rulesets.router)
app.include_router(traces.router)
app.include_router(stats.router)
app.include_router(violations.router)
app.include_router(graph.router)
app.include_router(spend.router)
app.include_router(reports.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/config")
async def public_config():
    # Public, safe-to-expose front-end config (Client ID is not a secret).
    return {"google_client_id": settings.google_client_id}


# ── Serve the built frontend (single-origin production) ──────────────────────
# When app/frontend/dist exists, this same service serves the SPA. API routes
# above always win; everything else falls back to index.html for client routing.
_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = _DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_DIST / "index.html")

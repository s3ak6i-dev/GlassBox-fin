import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.backend.config import settings
from app.backend.db import create_all_tables
from app.backend.routers import (
    auth, orgs, workspaces, fleets, agents, ingest, holds, vendors, rulesets,
    traces, stats, violations, graph, spend, reports
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_all_tables()
    yield


app = FastAPI(title="glassbox API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
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

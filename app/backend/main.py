from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.backend.config import settings
from app.backend.db import create_all_tables
from app.backend.routers import auth, orgs, workspaces, fleets, agents


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_all_tables()
    yield


app = FastAPI(title="glassbox API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(orgs.router)
app.include_router(workspaces.router)
app.include_router(fleets.router)
app.include_router(agents.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}

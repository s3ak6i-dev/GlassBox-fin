"""Rate limiting (slowapi).

Auth endpoints are limited per client IP; ingest endpoints per instrumentation
key (so a single leaked key can't write unbounded traces). In-memory storage is
fine for the current single-worker deployment — move to Redis when scaling out.
"""
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.backend.config import settings


def glassbox_key_func(request: Request) -> str:
    """Key ingest limits by the instrumentation key, falling back to IP."""
    return request.headers.get("X-Glassbox-Key") or get_remote_address(request)


limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.rate_limit_enabled,
    storage_uri="memory://",
)

# Tunable limits (kept here so they're easy to find).
AUTH_LIMIT = "10/minute"        # login / signup / google / password
INGEST_LIMIT = "240/minute"     # per instrumentation key

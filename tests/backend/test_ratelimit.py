"""Verify rate limiting actually triggers (it's disabled elsewhere in tests)."""
import pytest

from app.backend.ratelimit import limiter

pytestmark = pytest.mark.asyncio


async def test_auth_endpoint_rate_limited(client):
    limiter.enabled = True
    try:
        codes = []
        for _ in range(12):  # AUTH_LIMIT is 10/minute
            r = await client.post("/api/auth/login", json={"email": "x@example.com", "password": "nope"})
            codes.append(r.status_code)
        assert 429 in codes, f"expected a 429 after the limit, got {codes}"
    finally:
        limiter.enabled = False

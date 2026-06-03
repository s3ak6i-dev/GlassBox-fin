"""Tiny stdlib HTTP helpers for the CLI's online commands.

Two auth styles:
  * Bearer JWT  — control-plane (login, status, holds)
  * X-Glassbox-Key — agent ingest (key test / ping)
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Optional


class ApiError(Exception):
    def __init__(self, message: str, status: Optional[int] = None) -> None:
        super().__init__(message)
        self.status = status


def request(
    method: str,
    url: str,
    *,
    token: Optional[str] = None,
    key: Optional[str] = None,
    body: Optional[dict] = None,
    timeout: int = 15,
) -> Any:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if key:
        headers["X-Glassbox-Key"] = key
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            if not raw:
                return None
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        detail = None
        try:
            detail = json.loads(exc.read()).get("detail")
        except Exception:
            pass
        raise ApiError(detail or f"HTTP {exc.code}", status=exc.code) from exc
    except urllib.error.URLError as exc:
        raise ApiError(f"cannot reach {url} — {exc.reason}") from exc


class ControlPlane:
    """JWT-authenticated client for the dashboard API."""

    def __init__(self, base: str, token: Optional[str] = None) -> None:
        self.base = base.rstrip("/")
        self.token = token

    def get(self, path: str, **kw) -> Any:
        return request("GET", f"{self.base}{path}", token=self.token, **kw)

    def post(self, path: str, body: Optional[dict] = None, **kw) -> Any:
        return request("POST", f"{self.base}{path}", token=self.token, body=body, **kw)


def ping_key(base: str, key: str, timeout: int = 10) -> dict:
    """Validate an instrumentation key against the backend."""
    return request("GET", f"{base.rstrip('/')}/api/ingest/ping", key=key, timeout=timeout)

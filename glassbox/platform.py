"""Platform helpers for multi-agent topologies.

spawn_subagent lets an orchestrator register child agents under itself, so the
fleet graph draws true agent → sub-agent edges. Uses only stdlib.
"""
from __future__ import annotations

import json
import urllib.request


def spawn_subagent(
    parent_key: str,
    name: str,
    api_url: str = "http://localhost:8000",
) -> str:
    """Register (or reuse) a sub-agent under the parent and return its
    instrumentation key. Records a parent → child edge for the fleet graph.
    """
    req = urllib.request.Request(
        f"{api_url.rstrip('/')}/api/ingest/subagent",
        data=json.dumps({"name": name}).encode(),
        headers={"X-Glassbox-Key": parent_key, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())["instrumentation_key"]

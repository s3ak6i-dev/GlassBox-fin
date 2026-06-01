"""In-process pub/sub for Server-Sent Events.

Each workspace has a set of subscriber queues. Ingest endpoints publish
events (trace_start, step, trace_end, hold) which fan out to every
connected dashboard for that workspace. Single-process only — fine for
dev and small deployments; swap for Redis pub/sub to scale horizontally.
"""
from __future__ import annotations

import asyncio
from collections import defaultdict


class EventBus:
    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)

    def subscribe(self, workspace_id: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers[workspace_id].add(q)
        return q

    def unsubscribe(self, workspace_id: str, q: asyncio.Queue) -> None:
        self._subscribers[workspace_id].discard(q)
        if not self._subscribers[workspace_id]:
            self._subscribers.pop(workspace_id, None)

    def publish(self, workspace_id: str, event: dict) -> None:
        for q in list(self._subscribers.get(workspace_id, ())):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass  # slow consumer — drop rather than block ingest


bus = EventBus()

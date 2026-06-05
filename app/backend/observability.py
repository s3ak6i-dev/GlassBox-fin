"""Structured logging + Sentry error tracking.

Both are no-ops unless configured: logging always runs (JSON to stdout), Sentry
only initializes when SENTRY_DSN is set.
"""
import json
import logging
import sys
import time

from app.backend.config import settings

logger = logging.getLogger("glassbox")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        for key, val in getattr(record, "extra_fields", {}).items():
            payload[key] = val
        return json.dumps(payload, default=str)


def setup_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(settings.log_level.upper())
    # Uvicorn access logs are noisy + unstructured — we log requests ourselves.
    logging.getLogger("uvicorn.access").handlers = []


def init_sentry() -> None:
    if not settings.sentry_dsn:
        return
    import sentry_sdk

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
    logger.info("sentry initialized", extra={"extra_fields": {"env": settings.environment}})


def log_event(msg: str, **fields) -> None:
    logger.info(msg, extra={"extra_fields": fields})

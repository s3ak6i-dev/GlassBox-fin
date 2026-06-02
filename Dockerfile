# ── Stage 1: build the React frontend ────────────────────────────────────────
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY app/frontend/package*.json ./
RUN npm ci
COPY app/frontend/ ./
RUN npm run build          # → app/frontend/dist

# ── Stage 2: Python backend serving the API + built SPA ──────────────────────
FROM python:3.12-slim AS runtime
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Backend deps + the glassbox library (installed from source)
COPY app/backend/requirements.txt ./app/backend/requirements.txt
RUN pip install -r app/backend/requirements.txt

# The library so the rule engine + reporters run server-side
COPY pyproject.toml README.md ./
COPY glassbox/ ./glassbox/
RUN pip install --no-deps .

# Backend source
COPY app/backend/ ./app/backend/

# Built frontend from stage 1 (FastAPI serves it from app/frontend/dist)
COPY --from=frontend /app/frontend/dist ./app/frontend/dist

EXPOSE 8000

# IMPORTANT: single worker — the SSE event bus is in-process. Scaling to
# multiple workers requires a shared broker (e.g. Redis pub/sub).
CMD ["sh", "-c", "uvicorn app.backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]

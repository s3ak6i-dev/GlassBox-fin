"""Test harness for the FastAPI backend.

Runs the whole app against an in-memory SQLite database so the suite needs no
Postgres/Neon connection. Two small shims make the Postgres-typed models
portable to SQLite for DDL purposes:

  * JSONB  -> JSON   (SQLite stores it as text; SQLAlchemy handles (de)serialisation)
  * UUID compiles cross-dialect already in SQLAlchemy 2, so no shim needed there.

A single shared connection (StaticPool) is used so every session in a test sees
the same in-memory schema and rows.
"""
import asyncio
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.pool import StaticPool


# --- make JSONB renderable on SQLite (DDL only) -----------------------------
@compiles(JSONB, "sqlite")
def _compile_jsonb_sqlite(element, compiler, **kw):  # noqa: ANN001
    return "JSON"


# --- coerce str -> uuid.UUID on bind for non-native dialects ----------------
# The app compares UUID columns against plain strings (JWT subject, path
# params). Postgres/asyncpg tolerates this; SQLite's generic Uuid bind
# processor calls value.hex and chokes on str. Wrap it (test-only).
_orig_bind_processor = Uuid.bind_processor


def _coercing_bind_processor(self, dialect):  # noqa: ANN001
    proc = _orig_bind_processor(self, dialect)
    if proc is None:
        return None

    def wrapped(value):
        if isinstance(value, str) and self.as_uuid:
            value = uuid.UUID(value)
        return proc(value)

    return wrapped


Uuid.bind_processor = _coercing_bind_processor


# Import after the shim is registered. This pulls in db.Base + every model.
# NB: the model imports must come before binding `app` below, otherwise
# `import app.backend.models...` rebinds the name `app` to the package.
import app.backend.models.org  # noqa: E402,F401
import app.backend.models.fleet  # noqa: E402,F401
import app.backend.models.trace  # noqa: E402,F401
import app.backend.models.violation  # noqa: E402,F401
import app.backend.models.ruleset  # noqa: E402,F401
import app.backend.models.spend  # noqa: E402,F401
from app.backend.db import Base, get_db  # noqa: E402
from app.backend.main import app  # noqa: E402


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def client():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def _override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    await engine.dispose()

"""Alembic environment — async, driven by the app's own settings + metadata."""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy.ext.compiler import compiles

# --- import the app so Base.metadata is fully populated ---------------------
from app.backend.config import settings
from app.backend.db import Base
import app.backend.models.org      # noqa: F401
import app.backend.models.fleet    # noqa: F401
import app.backend.models.trace    # noqa: F401
import app.backend.models.violation  # noqa: F401
import app.backend.models.ruleset  # noqa: F401
import app.backend.models.spend    # noqa: F401


# Let JSONB columns render as JSON on SQLite (handy for offline/dev checks;
# a no-op against Postgres, which renders JSONB natively).
@compiles(JSONB, "sqlite")
def _compile_jsonb_sqlite(element, compiler, **kw):  # noqa: ANN001
    return "JSON"


config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# URL comes from settings by default; pass `-x db_url=...` to target another
# database (e.g. an empty DB when generating the baseline migration).
_x_args = context.get_x_argument(as_dictionary=True)
_db_url = _x_args.get("db_url") or settings.async_database_url
config.set_main_option("sqlalchemy.url", _db_url)

target_metadata = Base.metadata

# SSL only for the (remote) Postgres path, never for a local override DB.
_connect_args = {"ssl": True} if (not _x_args.get("db_url") and settings.requires_ssl) else {}


def run_migrations_offline() -> None:
    context.configure(
        url=_db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def _do_run_migrations(connection) -> None:  # noqa: ANN001
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=_connect_args,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(_do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())

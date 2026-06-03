# Database migrations (Alembic)

Schema changes are managed with [Alembic](https://alembic.sqlalchemy.org/).
The environment (`env.py`) is async and pulls the database URL and metadata
straight from the app, so you don't configure a URL anywhere by hand.

Run all commands from the **repo root** (where `alembic.ini` lives). The URL is
read from `app/backend/.env` via `app.backend.config.settings`.

## Everyday workflow

After changing a SQLAlchemy model, generate and apply a migration:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

Always review the generated file in `versions/` before applying — autogenerate
is a good first draft, not gospel (it can miss server-side defaults, enum
changes, etc.).

Other useful commands:

```bash
alembic current            # what revision is the DB on?
alembic history            # list revisions
alembic downgrade -1       # roll back one revision
```

## One-time setup for the existing Neon database

The live database was originally built with `Base.metadata.create_all` (plus a
few manual `ALTER`s), so its tables already match the initial migration. Tell
Alembic that without re-running the DDL:

```bash
alembic stamp head
```

From then on, every schema change goes through `revision --autogenerate` +
`upgrade head` — no more manual `ALTER`s.

## Fresh deploys

A brand-new database is built entirely from migrations:

```bash
alembic upgrade head
```

## Targeting another database ad-hoc

Pass `-x db_url=...` to point at a different database without touching `.env`
(used to generate the baseline against an empty DB):

```bash
alembic -x db_url="sqlite+aiosqlite:///./scratch.db" upgrade head
```

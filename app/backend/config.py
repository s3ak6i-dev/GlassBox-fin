from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_PATH = Path(__file__).resolve().parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_PATH), env_file_encoding="utf-8")

    database_url: str = "postgresql+asyncpg://glassbox:glassbox@localhost/glassbox"
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_days: int = 7
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    google_client_id: str = ""   # set to enable "Sign in with Google"

    # Ops / observability
    environment: str = "development"
    log_level: str = "INFO"
    sentry_dsn: str = ""              # set to enable error tracking
    rate_limit_enabled: bool = True   # disabled in the test suite

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def async_database_url(self) -> str:
        """Normalise any pasted Postgres URL (e.g. Neon) for SQLAlchemy + asyncpg.

        - Forces the asyncpg driver.
        - Strips libpq-only query params (sslmode, channel_binding, etc.) that
          asyncpg does not understand — SSL is handled via connect_args instead.
        """
        url = self.database_url
        parts = urlsplit(url)
        scheme = parts.scheme
        if scheme in ("postgres", "postgresql"):
            scheme = "postgresql+asyncpg"
        # Drop query params asyncpg can't parse
        cleaned = urlunsplit((scheme, parts.netloc, parts.path, "", ""))
        return cleaned

    @property
    def requires_ssl(self) -> bool:
        """True when the original URL asked for SSL (Neon and most cloud PG)."""
        parts = urlsplit(self.database_url)
        q = dict(parse_qsl(parts.query))
        if q.get("sslmode") in ("require", "verify-ca", "verify-full"):
            return True
        # Remote hosts (not localhost) default to SSL
        host = parts.hostname or ""
        return host not in ("localhost", "127.0.0.1", "")


settings = Settings()

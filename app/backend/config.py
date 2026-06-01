from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql+asyncpg://glassbox:glassbox@localhost/glassbox"
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_days: int = 7
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()

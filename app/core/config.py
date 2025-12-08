from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Study Tool API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: Literal["development", "production", "testing"] = "development"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"
    DATABASE_TEST_URL: str = "sqlite+aiosqlite:///./test.db"
    DB_ECHO: bool = False
    RESET_DB_ON_STARTUP: bool = False

    # Logging
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # Security
    SECRET_KEY: str = "changethis"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )


@lru_cache
def get_settings():
    return Settings()

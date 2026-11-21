"""Configuración central de la aplicación.

Los valores se leen de variables de entorno o de un archivo .env
(se busca en backend/.env y en la raíz del repositorio).
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ---------- Aplicación ----------
    APP_NAME: str = "MiMascota API"
    APP_ENV: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # ---------- Seguridad (JWT) ----------
    JWT_SECRET_KEY: str  # obligatorio, sin valor por defecto
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ---------- PostgreSQL ----------
    POSTGRES_USER: str = "mimascota"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "mimascota"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # ---------- MongoDB ----------
    MONGO_URI: str = "mongodb://localhost:27017/?directConnection=true"
    MONGO_DB: str = "mimascota"

    # ---------- Redis ----------
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0
    SEARCH_CACHE_TTL_SECONDS: int = 300

    @property
    def postgres_url(self) -> URL:
        """URL de conexión asíncrona (asyncpg). Escapa caracteres especiales de la contraseña."""
        return URL.create(
            drivername="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_HOST,
            port=self.POSTGRES_PORT,
            database=self.POSTGRES_DB,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

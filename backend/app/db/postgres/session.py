"""Motor y sesiones asíncronas de PostgreSQL. Se abren y cierran en el lifespan."""

from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


async def connect() -> None:
    global _engine, _session_factory
    _engine = create_async_engine(
        settings.postgres_url,
        pool_pre_ping=True,
        echo=settings.DEBUG,
    )
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)


async def close() -> None:
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None


async def ping() -> None:
    """Ejecuta SELECT 1. Lanza una excepción si PostgreSQL no responde."""
    if _engine is None:
        raise RuntimeError("PostgreSQL no inicializado")
    async with _engine.connect() as conn:
        await conn.execute(text("SELECT 1"))


async def get_session() -> AsyncIterator[AsyncSession]:
    """Dependencia de FastAPI: una sesión por petición.

    Para operaciones que deben ser atómicas (p. ej. aprobar una solicitud y
    registrar la adopción) usar `async with session.begin(): ...`.
    """
    if _session_factory is None:
        raise RuntimeError("PostgreSQL no inicializado")
    async with _session_factory() as session:
        yield session

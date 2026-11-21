"""Cliente de Redis (redis.asyncio). Se abre y cierra en el lifespan."""

from redis.asyncio import Redis

from app.core.config import settings

_redis: Redis | None = None


async def connect() -> None:
    global _redis
    _redis = Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD or None,
        db=settings.REDIS_DB,
        decode_responses=True,
        socket_connect_timeout=3,
    )


async def close() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def ping() -> None:
    """Envía PING. Lanza una excepción si Redis no responde."""
    if _redis is None:
        raise RuntimeError("Redis no inicializado")
    await _redis.ping()


def get_redis() -> Redis:
    if _redis is None:
        raise RuntimeError("Redis no inicializado")
    return _redis

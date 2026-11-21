"""Caché de resultados de búsqueda de mascotas.

Patrón cache-aside: el servicio consulta primero Redis; si no hay datos,
consulta MongoDB y guarda el resultado con un TTL.
"""

import hashlib
import json
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings

SEARCH_KEY_PREFIX = "pets:search:"


def build_search_key(**params: Any) -> str:
    """Clave determinista a partir de los filtros de búsqueda (ignora los None)."""
    clean = {k: v for k, v in sorted(params.items()) if v is not None}
    digest = hashlib.sha256(json.dumps(clean, default=str).encode()).hexdigest()[:32]
    return f"{SEARCH_KEY_PREFIX}{digest}"


async def get_cached(redis: Redis, key: str) -> Any | None:
    raw = await redis.get(key)
    return json.loads(raw) if raw is not None else None


async def set_cached(redis: Redis, key: str, value: Any, ttl: int | None = None) -> None:
    await redis.set(
        key,
        json.dumps(value, default=str),
        ex=ttl or settings.SEARCH_CACHE_TTL_SECONDS,
    )


async def invalidate_pet_searches(redis: Redis) -> None:
    """Borra las búsquedas en caché. Llamar al crear/editar/adoptar una mascota."""
    async for key in redis.scan_iter(match=f"{SEARCH_KEY_PREFIX}*"):
        await redis.delete(key)

"""Notificaciones con Redis Pub/Sub.

Cada usuario tiene su canal: notifications:user:<id>.
Ejemplo de uso: cuando una fundación aprueba o rechaza una solicitud,
se publica un mensaje en el canal del adoptante.
"""

import json
from collections.abc import AsyncIterator
from typing import Any

from redis.asyncio import Redis

CHANNEL_PREFIX = "notifications:user:"


def user_channel(user_id: int) -> str:
    return f"{CHANNEL_PREFIX}{user_id}"


async def publish(redis: Redis, channel: str, message: dict[str, Any]) -> int:
    """Publica un mensaje JSON. Devuelve el número de suscriptores que lo recibieron."""
    return await redis.publish(channel, json.dumps(message, default=str))


async def subscribe(redis: Redis, channel: str) -> AsyncIterator[dict[str, Any]]:
    """Generador asíncrono que entrega los mensajes recibidos en un canal."""
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)
    try:
        async for msg in pubsub.listen():
            if msg["type"] == "message":
                yield json.loads(msg["data"])
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()

"""Notificaciones a usuarios mediante Redis Pub/Sub."""

from datetime import datetime, timezone
from typing import Any

from redis.asyncio import Redis

from app.cache import pubsub


async def notify_user(redis: Redis, user_id: int, event: str, data: dict[str, Any]) -> int:
    """Publica un evento en el canal del usuario (p. ej. 'adoption_request.approved')."""
    message = {
        "event": event,
        "data": data,
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }
    return await pubsub.publish(redis, pubsub.user_channel(user_id), message)


# TODO: definir cómo llegan las notificaciones al frontend (por ejemplo, un
# endpoint que consuma pubsub.subscribe(...) y las reenvíe al cliente).

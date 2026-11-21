"""Endpoint /health: verifica las conexiones a PostgreSQL, MongoDB y Redis."""

import asyncio
from collections.abc import Awaitable, Callable

from fastapi import APIRouter, Response, status

from app.cache import client as redis_client
from app.core.config import settings
from app.db.mongo import client as mongo_client
from app.db.postgres import session as postgres_session

router = APIRouter(tags=["health"])

CHECK_TIMEOUT_SECONDS = 3.0


async def _check(name: str, ping: Callable[[], Awaitable[None]]) -> tuple[str, dict[str, str]]:
    try:
        await asyncio.wait_for(ping(), timeout=CHECK_TIMEOUT_SECONDS)
        return name, {"status": "ok"}
    except Exception as exc:  # noqa: BLE001 - se reporta cualquier fallo de conexión
        # En producción no se exponen detalles internos del error
        error_type = exc.__class__.__name__
        detail = (str(exc) or error_type) if settings.DEBUG else error_type
        return name, {"status": "error", "detail": detail}


@router.get("/health", summary="Estado de la API y de las bases de datos")
async def health(response: Response) -> dict:
    # Se consultan los módulos en tiempo de ejecución para poder simularlos en las pruebas
    results = await asyncio.gather(
        _check("postgres", postgres_session.ping),
        _check("mongodb", mongo_client.ping),
        _check("redis", redis_client.ping),
    )
    services = dict(results)
    healthy = all(s["status"] == "ok" for s in services.values())
    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"status": "ok" if healthy else "degraded", "services": services}

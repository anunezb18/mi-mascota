"""Solicitudes de adopción y adopciones (PostgreSQL, con efectos en MongoDB y Redis)."""

from motor.motor_asyncio import AsyncIOMotorDatabase
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres.models import AdoptionRequest
from app.schemas.adoption import AdoptionRequestCreate, AdoptionRequestReview


async def create_request(
    session: AsyncSession,
    mongo: AsyncIOMotorDatabase,
    redis: Redis,
    adopter_id: int,
    data: AdoptionRequestCreate,
) -> AdoptionRequest:
    """TODO:
    1. Verificar en MongoDB que la mascota exista y esté 'available'.
    2. Insertar la solicitud con foundation_id = pet.foundation_id.
       El índice único parcial impide duplicar solicitudes pendientes.
    3. Notificar a la fundación (notification_service).
    """
    raise NotImplementedError


async def list_requests_for_user(
    session: AsyncSession, user_id: int, role: str
) -> list[AdoptionRequest]:
    """TODO: adoptante -> sus solicitudes; fundación -> las recibidas; admin -> todas."""
    raise NotImplementedError


async def review_request(
    session: AsyncSession,
    mongo: AsyncIOMotorDatabase,
    redis: Redis,
    request_id: int,
    foundation_user_id: int,
    data: AdoptionRequestReview,
) -> AdoptionRequest:
    """TODO (transacción en PostgreSQL):
    async with session.begin():
        1. Bloquear la solicitud (SELECT ... FOR UPDATE) y validar que esté 'pending'
           y pertenezca a la fundación.
        2. Actualizar su estado.
        3. Si se aprueba: insertar en adoptions y rechazar las demás pendientes
           de la misma mascota.
    Después del commit: marcar la mascota como 'adopted' en MongoDB,
    invalidar la caché y notificar al adoptante por Pub/Sub.
    """
    raise NotImplementedError


async def cancel_request(session: AsyncSession, request_id: int, adopter_id: int) -> AdoptionRequest:
    """TODO: el adoptante cancela su solicitud mientras esté 'pending'."""
    raise NotImplementedError

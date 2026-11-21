"""Solicitudes de adopción."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.errors import not_implemented
from app.core.roles import UserRole
from app.dependencies.auth import AuthenticatedUser, require_roles
from app.dependencies.db import MongoDatabase, PostgresSession, RedisClient
from app.schemas.adoption import (
    AdoptionRequestCreate,
    AdoptionRequestRead,
    AdoptionRequestReview,
)
from app.schemas.auth import CurrentUser

router = APIRouter()


@router.post("", response_model=AdoptionRequestRead, status_code=status.HTTP_201_CREATED)
async def create_request(
    data: AdoptionRequestCreate,
    session: PostgresSession,
    mongo: MongoDatabase,
    redis: RedisClient,
    user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADOPTER))],
) -> AdoptionRequestRead:
    """TODO: adoption_service.create_request(session, mongo, redis, user.id, data)."""
    raise not_implemented()


@router.get("", response_model=list[AdoptionRequestRead])
async def list_requests(user: AuthenticatedUser, session: PostgresSession) -> list[AdoptionRequestRead]:
    """Solicitudes visibles para el usuario según su rol.

    TODO: adoption_service.list_requests_for_user(session, user.id, user.role)
    """
    raise not_implemented()


@router.patch("/{request_id}/review", response_model=AdoptionRequestRead)
async def review_request(
    request_id: int,
    data: AdoptionRequestReview,
    session: PostgresSession,
    mongo: MongoDatabase,
    redis: RedisClient,
    user: Annotated[CurrentUser, Depends(require_roles(UserRole.FOUNDATION))],
) -> AdoptionRequestRead:
    """La fundación aprueba o rechaza una solicitud (transacción).

    TODO: adoption_service.review_request(...)
    """
    raise not_implemented()


@router.patch("/{request_id}/cancel", response_model=AdoptionRequestRead)
async def cancel_request(
    request_id: int,
    session: PostgresSession,
    user: Annotated[CurrentUser, Depends(require_roles(UserRole.ADOPTER))],
) -> AdoptionRequestRead:
    """TODO: adoption_service.cancel_request(session, request_id, user.id)."""
    raise not_implemented()

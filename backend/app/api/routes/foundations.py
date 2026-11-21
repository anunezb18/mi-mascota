"""Fundaciones."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.errors import not_implemented
from app.core.roles import UserRole
from app.dependencies.auth import require_roles
from app.dependencies.db import PostgresSession
from app.schemas.auth import CurrentUser
from app.schemas.foundation import FoundationCreate, FoundationRead

router = APIRouter()


@router.get("", response_model=list[FoundationRead])
async def list_foundations(session: PostgresSession, city: str | None = None) -> list[FoundationRead]:
    """TODO: foundation_service.list_foundations(session, city)."""
    raise not_implemented()


@router.get("/{foundation_id}", response_model=FoundationRead)
async def get_foundation(foundation_id: int, session: PostgresSession) -> FoundationRead:
    """TODO: foundation_service.get_foundation(...) y 404 si no existe."""
    raise not_implemented()


@router.post("", response_model=FoundationRead, status_code=status.HTTP_201_CREATED)
async def create_foundation(
    data: FoundationCreate,
    session: PostgresSession,
    user: Annotated[CurrentUser, Depends(require_roles(UserRole.FOUNDATION))],
) -> FoundationRead:
    """Crea el perfil de la fundación del usuario autenticado.

    TODO: foundation_service.create_foundation(session, user.id, data)
    """
    raise not_implemented()

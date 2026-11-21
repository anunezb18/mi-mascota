"""Usuarios."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.errors import not_implemented
from app.core.roles import UserRole
from app.dependencies.auth import AuthenticatedUser, require_roles
from app.dependencies.db import PostgresSession
from app.schemas.auth import CurrentUser
from app.schemas.user import UserRead

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def read_me(user: AuthenticatedUser, session: PostgresSession) -> UserRead:
    """Perfil del usuario autenticado.

    TODO: consultar el usuario por user.id en PostgreSQL.
    """
    raise not_implemented()


@router.get("", response_model=list[UserRead])
async def list_users(
    admin: Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN))],
    session: PostgresSession,
) -> list[UserRead]:
    """Listado de usuarios (solo administrador).

    TODO: consulta paginada de usuarios.
    """
    raise not_implemented()

"""Gestión de fundaciones (PostgreSQL)."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres.models import Foundation
from app.schemas.foundation import FoundationCreate


async def create_foundation(session: AsyncSession, user_id: int, data: FoundationCreate) -> Foundation:
    """TODO: crear el perfil de fundación del usuario (user_id es UNIQUE)."""
    raise NotImplementedError


async def list_foundations(session: AsyncSession, city: str | None = None) -> list[Foundation]:
    """TODO: listar fundaciones, opcionalmente filtradas por ciudad."""
    raise NotImplementedError


async def get_foundation(session: AsyncSession, foundation_id: int) -> Foundation | None:
    """TODO: obtener una fundación por id."""
    raise NotImplementedError


async def get_foundation_by_user(session: AsyncSession, user_id: int) -> Foundation | None:
    """TODO: obtener la fundación asociada a un usuario con rol 'foundation'."""
    raise NotImplementedError

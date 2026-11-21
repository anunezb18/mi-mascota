"""Registro e inicio de sesión de usuarios (PostgreSQL)."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres.models import User
from app.schemas.auth import Token
from app.schemas.user import UserCreate


async def register_user(session: AsyncSession, data: UserCreate) -> User:
    """TODO:
    1. Verificar que el email no exista (o capturar IntegrityError).
    2. Crear User con password_hash = hash_password(data.password).
    3. Guardar con commit y devolver el usuario.
    """
    raise NotImplementedError


async def authenticate_user(session: AsyncSession, email: str, password: str) -> Token:
    """TODO:
    1. Buscar el usuario por email y comprobar que esté activo.
    2. Validar la contraseña con verify_password.
    3. Devolver Token(access_token=create_access_token(user.id, user.role)).
    """
    raise NotImplementedError

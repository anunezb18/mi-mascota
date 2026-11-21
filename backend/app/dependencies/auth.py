"""Autenticación (JWT) y autorización por roles."""

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.core.config import settings
from app.core.roles import UserRole
from app.core.security import decode_access_token
from app.schemas.auth import CurrentUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> CurrentUser:
    """Valida el JWT del encabezado Authorization: Bearer <token>."""
    try:
        payload = decode_access_token(token)
        user = CurrentUser(id=int(payload["sub"]), role=UserRole(payload["role"]))
    except (JWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas o token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    # TODO: verificar en PostgreSQL que el usuario siga existiendo y esté activo.
    return user


def require_roles(*roles: UserRole) -> Callable[..., Awaitable[CurrentUser]]:
    """Restringe una ruta a ciertos roles. Uso: Depends(require_roles(UserRole.ADMIN))."""

    async def checker(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para esta acción",
            )
        return user

    return checker


AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]

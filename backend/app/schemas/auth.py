"""Esquemas de autenticación."""

from pydantic import BaseModel

from app.core.roles import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CurrentUser(BaseModel):
    """Datos del usuario extraídos del JWT."""

    id: int
    role: UserRole

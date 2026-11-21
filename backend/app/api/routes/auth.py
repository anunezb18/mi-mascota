"""Registro e inicio de sesión (JWT)."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.errors import not_implemented
from app.dependencies.db import PostgresSession
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserRead

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, session: PostgresSession) -> UserRead:
    """Crea un usuario adoptante o fundación.

    TODO: return await auth_service.register_user(session, data)  (409 si el email existe)
    """
    raise not_implemented()


@router.post("/login", response_model=Token)
async def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], session: PostgresSession
) -> Token:
    """Devuelve un JWT. El campo `username` del formulario es el email.

    TODO: return await auth_service.authenticate_user(session, form.username, form.password)
    """
    raise not_implemented()

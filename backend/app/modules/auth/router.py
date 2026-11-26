from fastapi import APIRouter, status

from app.api.dependencies.auth import UsuarioActual
from app.modules.usuarios.service import usuario_publico

from . import service
from .schemas import LoginIn, RegistroIn

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login")
async def login(datos: LoginIn):
    return await service.login(datos)


@router.post("/registro", status_code=status.HTTP_201_CREATED)
async def registro(datos: RegistroIn):
    return await service.registrar(datos)


@router.get("/me")
async def me(usuario: UsuarioActual):
    return usuario_publico(usuario)

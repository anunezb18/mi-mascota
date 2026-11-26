from fastapi import APIRouter, Response, status

from app.api.dependencies.auth import Adoptante, UsuarioActual

from . import service
from .schemas import ActualizarCuentaIn, CambiarContrasenaIn, PerfilEstiloVidaIn

router = APIRouter(prefix="/usuarios", tags=["Cuenta"])


@router.patch("/me")
async def actualizar_cuenta(datos: ActualizarCuentaIn, usuario: UsuarioActual):
    return await service.actualizar_cuenta(usuario, datos)


@router.put("/me/contrasena", status_code=status.HTTP_204_NO_CONTENT)
async def cambiar_contrasena(datos: CambiarContrasenaIn, usuario: UsuarioActual):
    await service.cambiar_contrasena(usuario, datos)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/me/perfil-estilo-vida")
async def guardar_perfil(datos: PerfilEstiloVidaIn, usuario: Adoptante):
    return await service.guardar_perfil(usuario, datos)

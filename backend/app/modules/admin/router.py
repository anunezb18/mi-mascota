from fastapi import APIRouter

from app.api.dependencies.auth import Administrador
from app.shared.tipos import EstadoValidacion, Rol

from . import service
from .schemas import CambiarEstadoUsuarioIn, ValidarFundacionIn

router = APIRouter(prefix="/admin", tags=["Administración"])


@router.get("/fundaciones")
async def fundaciones(_: Administrador, estado: EstadoValidacion | None = None, q: str | None = None):
    return await service.listar_fundaciones(estado, q)


@router.patch("/fundaciones/{fundacion_id}/validacion")
async def validar_fundacion(fundacion_id: str, datos: ValidarFundacionIn, _: Administrador):
    return await service.validar_fundacion(fundacion_id, datos)


@router.get("/usuarios")
async def usuarios(_: Administrador, q: str | None = None, rol: Rol | None = None, activo: bool | None = None):
    return await service.listar_usuarios(q, rol, activo)


@router.patch("/usuarios/{usuario_id}/estado")
async def cambiar_estado_usuario(usuario_id: str, datos: CambiarEstadoUsuarioIn, admin: Administrador):
    return await service.cambiar_estado_usuario(admin, usuario_id, datos)

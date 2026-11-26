"""Dependencias de autenticación y autorización por rol."""

from typing import Annotated, Any

from bson import ObjectId
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.errors import error
from app.core.security import decodificar_token
from app.db.mongo import FUNDACIONES, USUARIOS, col

_bearer = HTTPBearer(auto_error=False)

Documento = dict[str, Any]


async def cargar_usuario_activo(usuario_id: str | None) -> Documento | None:
    """Usuario del token si existe y está activo (borrado lógico)."""
    if not usuario_id or not ObjectId.is_valid(usuario_id):
        return None
    usuario = await col(USUARIOS).find_one({"_id": ObjectId(usuario_id)})
    if not usuario or not usuario.get("activo"):
        return None
    return usuario


async def usuario_actual(
    credenciales: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Documento:
    if credenciales is None:
        error(401, "Inicie sesión para continuar.")
    usuario = await cargar_usuario_activo(decodificar_token(credenciales.credentials))
    if usuario is None:
        # Token inválido o vencido, o cuenta desactivada: el frontend cierra la sesión
        error(401, "Su sesión expiró. Inicie sesión nuevamente.")
    return usuario


def requiere_rol(*roles: str):
    async def dependencia(usuario: Annotated[Documento, Depends(usuario_actual)]) -> Documento:
        if usuario["rol"] not in roles:
            error(403, "No tiene permisos para realizar esta acción.")
        return usuario

    return dependencia


UsuarioActual = Annotated[Documento, Depends(usuario_actual)]
Adoptante = Annotated[Documento, Depends(requiere_rol("adoptante"))]
UsuarioFundacion = Annotated[Documento, Depends(requiere_rol("fundacion"))]
Administrador = Annotated[Documento, Depends(requiere_rol("administrador"))]


async def fundacion_actual(usuario: UsuarioFundacion) -> Documento:
    fundacion = await col(FUNDACIONES).find_one({"_id": usuario.get("fundacion_id")})
    if fundacion is None:
        error(404, "No se encontró la fundación asociada a esta cuenta.")
    return fundacion


async def fundacion_aprobada(fundacion: Annotated[Documento, Depends(fundacion_actual)]) -> Documento:
    """Las escrituras de la fundación exigen que el administrador la haya aprobado."""
    if fundacion["estado_validacion"] != "aprobada":
        error(403, "Su fundación aún no ha sido validada por el administrador. No puede publicar ni gestionar mascotas.")
    return fundacion


FundacionActual = Annotated[Documento, Depends(fundacion_actual)]
FundacionAprobada = Annotated[Documento, Depends(fundacion_aprobada)]

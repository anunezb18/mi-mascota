from typing import Annotated

from fastapi import APIRouter, Query

from app.api.dependencies.auth import UsuarioActual

from . import service

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.get("")
async def listar(
    usuario: UsuarioActual,
    solo_no_leidas: bool = False,
    limite: Annotated[int | None, Query(ge=1, le=200)] = None,
):
    return await service.listar(usuario["_id"], solo_no_leidas, limite)


@router.get("/no-leidas/total")
async def total_no_leidas(usuario: UsuarioActual):
    return {"total": await service.total_no_leidas(usuario["_id"])}


@router.patch("/leer-todas")
async def marcar_todas_leidas(usuario: UsuarioActual):
    return {"actualizadas": await service.marcar_todas_leidas(usuario["_id"])}


@router.patch("/{notificacion_id}/leida")
async def marcar_leida(notificacion_id: str, usuario: UsuarioActual):
    return await service.marcar_leida(usuario["_id"], notificacion_id)

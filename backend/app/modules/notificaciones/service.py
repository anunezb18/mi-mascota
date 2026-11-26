"""Notificaciones. Cada inserción la reenvía el change stream por WebSocket (app/realtime)."""

from typing import Any

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.asynchronous.client_session import AsyncClientSession

from app.core.errors import error
from app.db.mongo import NOTIFICACIONES, USUARIOS, col
from app.shared.serializacion import a_json, ahora, oid, sin_nulos


async def notificar(
    usuario_id: ObjectId,
    tipo: str,
    titulo: str,
    mensaje: str,
    enlace: str | None = None,
    session: AsyncClientSession | None = None,
) -> None:
    """Inserta la notificación. Dentro de una transacción solo se emite al confirmarse (commit)."""
    documento = sin_nulos(
        {
            "usuario_id": usuario_id,
            "tipo": tipo,
            "titulo": titulo,
            "mensaje": mensaje,
            "enlace": enlace,
            "leida": False,
            "fecha": ahora(),
        }
    )
    await col(NOTIFICACIONES).insert_one(documento, session=session)


async def notificar_administradores(
    tipo: str, titulo: str, mensaje: str, enlace: str, session: AsyncClientSession | None = None
) -> None:
    async for admin in col(USUARIOS).find({"rol": "administrador", "activo": True}, {"_id": 1}, session=session):
        await notificar(admin["_id"], tipo, titulo, mensaje, enlace, session=session)


async def listar(usuario_id: ObjectId, solo_no_leidas: bool, limite: int | None) -> list[dict[str, Any]]:
    filtro: dict[str, Any] = {"usuario_id": usuario_id}
    if solo_no_leidas:
        filtro["leida"] = False
    cursor = col(NOTIFICACIONES).find(filtro).sort("fecha", -1)
    if limite:
        cursor = cursor.limit(limite)
    return [a_json(n) async for n in cursor]


async def total_no_leidas(usuario_id: ObjectId) -> int:
    return await col(NOTIFICACIONES).count_documents({"usuario_id": usuario_id, "leida": False})


async def marcar_leida(usuario_id: ObjectId, notificacion_id: str) -> dict[str, Any]:
    notificacion = await col(NOTIFICACIONES).find_one_and_update(
        {"_id": oid(notificacion_id, "La notificación"), "usuario_id": usuario_id},
        {"$set": {"leida": True}},
        return_document=ReturnDocument.AFTER,
    )
    if notificacion is None:
        error(404, "La notificación no existe.")
    return a_json(notificacion)


async def marcar_todas_leidas(usuario_id: ObjectId) -> int:
    resultado = await col(NOTIFICACIONES).update_many({"usuario_id": usuario_id, "leida": False}, {"$set": {"leida": True}})
    return resultado.modified_count

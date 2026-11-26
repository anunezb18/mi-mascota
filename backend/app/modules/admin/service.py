from typing import Any

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.asynchronous.client_session import AsyncClientSession

from app.core.errors import error
from app.db.mongo import FUNDACIONES, USUARIOS, cliente, col
from app.modules.notificaciones.service import notificar
from app.modules.usuarios.service import PROYECCION_PUBLICA, usuario_publico
from app.shared.serializacion import a_json, ahora, oid
from app.shared.texto import regex_digitos, regex_flexible

from .schemas import CambiarEstadoUsuarioIn, ValidarFundacionIn

# $lookup: datos de la cuenta que registró cada fundación
_REPRESENTANTE = [
    {
        "$lookup": {
            "from": USUARIOS,
            "localField": "usuario_id",
            "foreignField": "_id",
            "as": "representante",
            "pipeline": [{"$project": {"nombre": 1, "correo": 1, "activo": 1}}],
        }
    },
    {
        "$set": {
            "representante": {
                "$ifNull": [
                    {"$first": "$representante"},
                    {"_id": "$usuario_id", "nombre": "Cuenta no disponible", "correo": "$correo", "activo": False},
                ]
            }
        }
    },
]


async def listar_fundaciones(estado: str | None, q: str | None) -> list[dict[str, Any]]:
    filtro: dict[str, Any] = {}
    if estado:
        filtro["estado_validacion"] = estado
    if q and q.strip():
        condiciones: list[dict[str, Any]] = [{"nombre": {"$regex": regex_flexible(q), "$options": "i"}}]
        if patron_nit := regex_digitos(q):
            condiciones.append({"nit": {"$regex": patron_nit}})
        filtro["$or"] = condiciones
    pipeline = [{"$match": filtro}, {"$sort": {"fecha_registro": -1}}, *_REPRESENTANTE]
    return [a_json(f) async for f in await col(FUNDACIONES).aggregate(pipeline)]


async def _fundacion_admin(fundacion_id: ObjectId) -> dict[str, Any]:
    pipeline = [{"$match": {"_id": fundacion_id}}, *_REPRESENTANTE]
    documentos = [f async for f in await col(FUNDACIONES).aggregate(pipeline)]
    return a_json(documentos[0])


async def validar_fundacion(fundacion_id: str, datos: ValidarFundacionIn) -> dict[str, Any]:
    _id = oid(fundacion_id, "La fundación")
    motivo = (datos.motivo_rechazo or "").strip()
    if datos.estado_validacion == "rechazada" and len(motivo) < 10:
        error(422, "Indique el motivo del rechazo (mínimo 10 caracteres).")

    cambios: dict[str, Any] = {"$set": {"estado_validacion": datos.estado_validacion, "fecha_validacion": ahora()}}
    if datos.estado_validacion == "rechazada":
        cambios["$set"]["motivo_rechazo"] = motivo

    async def transaccion(session: AsyncClientSession) -> None:
        fundacion = await col(FUNDACIONES).find_one_and_update(
            {"_id": _id, "estado_validacion": "pendiente"}, cambios, return_document=ReturnDocument.AFTER, session=session
        )
        if fundacion is None:
            if await col(FUNDACIONES).count_documents({"_id": _id}, limit=1, session=session):
                error(409, "Esta fundación ya fue validada.")
            error(404, "La fundación no existe.")
        if datos.estado_validacion == "aprobada":
            await notificar(
                fundacion["usuario_id"],
                "fundacion_aprobada",
                "¡Su fundación fue aprobada!",
                f"{fundacion['nombre']} ya puede publicar mascotas y gestionar solicitudes de adopción.",
                "/fundacion",
                session=session,
            )
        else:
            await notificar(
                fundacion["usuario_id"],
                "fundacion_rechazada",
                "Registro de fundación rechazado",
                f"El administrador no aprobó el registro de {fundacion['nombre']}. Consulte el motivo en su panel.",
                "/fundacion",
                session=session,
            )

    async with cliente().start_session() as session:
        await session.with_transaction(transaccion)
    return await _fundacion_admin(_id)


async def listar_usuarios(q: str | None, rol: str | None, activo: bool | None) -> list[dict[str, Any]]:
    filtro: dict[str, Any] = {}
    if rol:
        filtro["rol"] = rol
    if activo is not None:
        filtro["activo"] = activo
    if q and q.strip():
        patron = {"$regex": regex_flexible(q), "$options": "i"}
        filtro["$or"] = [{"nombre": patron}, {"correo": patron}]
    cursor = col(USUARIOS).find(filtro, PROYECCION_PUBLICA).sort("fecha_registro", -1)
    return [a_json(u) async for u in cursor]


async def cambiar_estado_usuario(admin: dict[str, Any], usuario_id: str, datos: CambiarEstadoUsuarioIn) -> dict[str, Any]:
    _id = oid(usuario_id, "El usuario")
    if _id == admin["_id"]:
        error(409, "No puede desactivar su propia cuenta.")
    # Borrado lógico: solo cambia el indicador; el documento nunca se elimina
    usuario = await col(USUARIOS).find_one_and_update(
        {"_id": _id}, {"$set": {"activo": datos.activo}}, return_document=ReturnDocument.AFTER
    )
    if usuario is None:
        error(404, "El usuario no existe.")
    return usuario_publico(usuario)

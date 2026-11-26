from typing import Any

from pymongo.asynchronous.client_session import AsyncClientSession
from pymongo.errors import DuplicateKeyError

from app.core.errors import error
from app.db.mongo import MASCOTAS, SOLICITUDES, USUARIOS, cliente, col
from app.modules.notificaciones.service import notificar
from app.shared.serializacion import a_json, ahora, oid, sin_nulos

from .schemas import CrearSolicitudIn, ResolverSolicitudIn

RECHAZO_AUTOMATICO = "Rechazada automáticamente: se aprobó otra solicitud para esta mascota."


async def crear(adoptante: dict[str, Any], datos: CrearSolicitudIn) -> dict[str, Any]:
    if not adoptante.get("perfil_estilo_vida"):
        error(422, "Complete su perfil de estilo de vida antes de enviar una solicitud.")
    mascota = await col(MASCOTAS).find_one({"_id": oid(datos.mascota_id, "La mascota")})
    if mascota is None:
        error(404, "La mascota no existe o fue retirada de la plataforma.")
    if mascota["estado"] == "adoptada":
        error(409, "Esta mascota ya fue adoptada.")

    fecha = ahora()
    solicitud = {
        "mascota_id": mascota["_id"],
        "adoptante_id": adoptante["_id"],
        "fundacion_id": mascota["fundacion_id"],
        "estado": "pendiente",
        "mensaje": datos.mensaje,
        # Patrón de subconjunto: la fundación revisa la solicitud sin consultar otras colecciones
        "mascota": sin_nulos(
            {"nombre": mascota["nombre"], "especie": mascota["especie"], "foto": (mascota["fotos"] or [None])[0]}
        ),
        "fundacion": {"nombre": mascota["fundacion"]["nombre"]},
        "adoptante": sin_nulos(
            {
                "nombre": adoptante["nombre"],
                "correo": adoptante["correo"],
                "telefono": adoptante.get("telefono"),
                "ciudad": adoptante.get("ciudad"),
                "perfil_estilo_vida": adoptante["perfil_estilo_vida"],
            }
        ),
        "historial_estados": [{"estado": "pendiente", "fecha": fecha, "nota": "Solicitud enviada por el adoptante."}],
        "fecha_creacion": fecha,
        "fecha_actualizacion": fecha,
    }
    cuenta_fundacion = await col(USUARIOS).find_one({"fundacion_id": mascota["fundacion_id"]}, {"_id": 1})

    async def transaccion(session: AsyncClientSession) -> None:
        resultado = await col(SOLICITUDES).insert_one(solicitud, session=session)
        solicitud["_id"] = resultado.inserted_id
        # La primera solicitud pasa la mascota a "en proceso"
        await col(MASCOTAS).update_one(
            {"_id": mascota["_id"], "estado": "disponible"}, {"$set": {"estado": "en_proceso"}}, session=session
        )
        if cuenta_fundacion:
            await notificar(
                cuenta_fundacion["_id"],
                "solicitud_recibida",
                "Nueva solicitud de adopción",
                f"{adoptante['nombre']} quiere adoptar a {mascota['nombre']}.",
                "/fundacion/solicitudes",
                session=session,
            )

    try:
        async with cliente().start_session() as session:
            await session.with_transaction(transaccion)
    except DuplicateKeyError:
        # Índice único parcial: una sola solicitud pendiente por adoptante y mascota
        error(409, "Ya tiene una solicitud pendiente para esta mascota.")
    return a_json(solicitud)


async def mias(adoptante: dict[str, Any]) -> list[dict[str, Any]]:
    cursor = col(SOLICITUDES).find({"adoptante_id": adoptante["_id"]}).sort("fecha_actualizacion", -1)
    return [a_json(s) async for s in cursor]


async def de_fundacion(fundacion: dict[str, Any]) -> list[dict[str, Any]]:
    cursor = col(SOLICITUDES).find({"fundacion_id": fundacion["_id"]}).sort("fecha_actualizacion", -1)
    return [a_json(s) async for s in cursor]


def _cerrar(estado: str, fecha, nota: str | None) -> dict[str, Any]:
    return {
        "$set": {"estado": estado, "fecha_actualizacion": fecha},
        "$push": {"historial_estados": sin_nulos({"estado": estado, "fecha": fecha, "nota": nota})},
    }


async def resolver(fundacion: dict[str, Any], solicitud_id: str, datos: ResolverSolicitudIn) -> dict[str, Any]:
    _id = oid(solicitud_id, "La solicitud")
    nota = (datos.nota or "").strip() or None
    if datos.estado == "rechazada" and not nota:
        error(422, "Indique el motivo del rechazo.")

    resultado: dict[str, Any] = {}

    async def transaccion(session: AsyncClientSession) -> None:
        solicitud = await col(SOLICITUDES).find_one({"_id": _id, "fundacion_id": fundacion["_id"]}, session=session)
        if solicitud is None:
            error(404, "La solicitud no existe.")
        if solicitud["estado"] != "pendiente":
            error(409, "Esta solicitud ya fue resuelta.")

        fecha = ahora()
        nombre_mascota = solicitud["mascota"]["nombre"]
        cerrada = await col(SOLICITUDES).update_one(
            {"_id": _id, "estado": "pendiente"},
            _cerrar(datos.estado, fecha, nota or ("Solicitud aprobada por la fundación." if datos.estado == "aprobada" else None)),
            session=session,
        )
        if cerrada.modified_count == 0:
            error(409, "Esta solicitud ya fue resuelta.")

        if datos.estado == "aprobada":
            # Transacción: aprobar + rechazar las demás pendientes + marcar la mascota como adoptada
            otras = [
                s
                async for s in col(SOLICITUDES).find(
                    {"mascota_id": solicitud["mascota_id"], "_id": {"$ne": _id}, "estado": "pendiente"},
                    {"adoptante_id": 1},
                    session=session,
                )
            ]
            if otras:
                await col(SOLICITUDES).update_many(
                    {"_id": {"$in": [s["_id"] for s in otras]}},
                    _cerrar("rechazada", fecha, RECHAZO_AUTOMATICO),
                    session=session,
                )
            await col(MASCOTAS).update_one(
                {"_id": solicitud["mascota_id"]}, {"$set": {"estado": "adoptada", "actualizado_en": fecha}}, session=session
            )
            await notificar(
                solicitud["adoptante_id"],
                "solicitud_aprobada",
                "¡Su solicitud fue aprobada!",
                f"{fundacion['nombre']} aprobó su solicitud para adoptar a {nombre_mascota}.",
                "/adoptante/solicitudes",
                session=session,
            )
            for s in otras:
                await notificar(
                    s["adoptante_id"],
                    "solicitud_rechazada",
                    "Solicitud no aprobada",
                    f"{nombre_mascota} fue adoptado por otra familia. Le invitamos a conocer otras mascotas.",
                    "/adoptante/solicitudes",
                    session=session,
                )
        else:
            quedan = await col(SOLICITUDES).count_documents(
                {"mascota_id": solicitud["mascota_id"], "estado": "pendiente"}, session=session
            )
            if quedan == 0:
                # Sin solicitudes pendientes, la mascota vuelve a estar disponible
                await col(MASCOTAS).update_one(
                    {"_id": solicitud["mascota_id"], "estado": "en_proceso"},
                    {"$set": {"estado": "disponible"}},
                    session=session,
                )
            await notificar(
                solicitud["adoptante_id"],
                "solicitud_rechazada",
                "Solicitud no aprobada",
                f"{fundacion['nombre']} revisó su solicitud para {nombre_mascota}. Consulte el motivo en sus solicitudes.",
                "/adoptante/solicitudes",
                session=session,
            )

        resultado.update(await col(SOLICITUDES).find_one({"_id": _id}, session=session))

    async with cliente().start_session() as session:
        await session.with_transaction(transaccion)
    return a_json(resultado)

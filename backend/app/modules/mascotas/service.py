from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import UploadFile
from gridfs.errors import NoFile
from pymongo import ReturnDocument

from app.core.errors import error
from app.db.mongo import MASCOTAS, SOLICITUDES, bucket_fotos, col
from app.shared.serializacion import a_json, ahora, oid, sin_nulos
from app.shared.texto import regex_flexible
from app.shared.tipos import ETAPA_RANGO_MESES

from .schemas import MascotaIn, MascotaUpdate, RegistroMedicoIn, validar_atributos

TIPOS_IMAGEN = {"image/jpeg", "image/png", "image/webp"}
TAMANO_MAXIMO_FOTO = 8 * 1024 * 1024


def construir_filtro(
    *,
    especie: str | None = None,
    tamano: str | None = None,
    etapa: str | None = None,
    temperamento: list[str] | None = None,
    estado: str | None = None,
    q: str | None = None,
    incluir_adoptadas: bool = False,
) -> dict[str, Any]:
    filtro: dict[str, Any] = {}
    if estado:
        filtro["estado"] = estado
    elif not incluir_adoptadas:
        # El catálogo público no muestra las mascotas ya adoptadas
        filtro["estado"] = {"$ne": "adoptada"}
    if especie:
        filtro["especie"] = especie
    if tamano:
        filtro["tamano"] = tamano
    if etapa:
        minimo, maximo = ETAPA_RANGO_MESES[etapa]
        filtro["edad_meses"] = {"$gte": minimo, **({"$lt": maximo} if maximo else {})}
    if temperamento:
        # Debe tener TODOS los rasgos elegidos
        filtro["temperamento"] = {"$all": temperamento}
    if q and q.strip():
        patron = {"$regex": regex_flexible(q), "$options": "i"}
        filtro["$or"] = [{"nombre": patron}, {"raza": patron}]
    return filtro


async def listar_catalogo(
    filtro: dict[str, Any],
    *,
    lat: float | None,
    lng: float | None,
    radio_km: float,
    limite: int | None,
) -> list[dict[str, Any]]:
    if lat is not None and lng is not None:
        # Búsqueda por cercanía: usa el índice 2dsphere y ordena por distancia
        pipeline: list[dict[str, Any]] = [
            {
                "$geoNear": {
                    "near": {"type": "Point", "coordinates": [lng, lat]},
                    "distanceField": "distancia_km",
                    "distanceMultiplier": 0.001,
                    "maxDistance": radio_km * 1000,
                    "query": filtro,
                    "spherical": True,
                }
            },
            {"$set": {"distancia_km": {"$round": ["$distancia_km", 2]}}},
        ]
        if limite:
            pipeline.append({"$limit": limite})
        cursor = await col(MASCOTAS).aggregate(pipeline)
        return [a_json(m) async for m in cursor]

    cursor = col(MASCOTAS).find(filtro).sort("fecha_publicacion", -1)
    if limite:
        cursor = cursor.limit(limite)
    return [a_json(m) async for m in cursor]


async def obtener(mascota_id: str) -> dict[str, Any]:
    mascota = await col(MASCOTAS).find_one({"_id": oid(mascota_id, "La mascota")})
    if mascota is None:
        error(404, "La mascota no existe o fue retirada de la plataforma.")
    return a_json(mascota)


async def _propia(mascota_id: str, fundacion: dict[str, Any]) -> dict[str, Any]:
    mascota = await col(MASCOTAS).find_one({"_id": oid(mascota_id, "La mascota")})
    if mascota is None:
        error(404, "La mascota no existe.")
    if mascota["fundacion_id"] != fundacion["_id"]:
        error(403, "Esta mascota pertenece a otra fundación.")
    return mascota


def resumen_fundacion(fundacion: dict[str, Any]) -> dict[str, Any]:
    """Patrón de referencia extendida: lo que el catálogo muestra de la fundación sin $lookup."""
    return sin_nulos(
        {
            "_id": fundacion["_id"],
            "nombre": fundacion["nombre"],
            "ciudad": fundacion["ciudad"],
            "localidad": fundacion.get("localidad"),
            "telefono": fundacion.get("telefono"),
            "correo": fundacion.get("correo"),
        }
    )


def _registro(registro: RegistroMedicoIn) -> dict[str, Any]:
    return sin_nulos({"_id": ObjectId(), **registro.model_dump()})


async def crear(fundacion: dict[str, Any], datos: MascotaIn) -> dict[str, Any]:
    fecha = ahora()
    historial = sorted((_registro(r) for r in datos.historial_medico), key=lambda r: r["fecha"], reverse=True)
    mascota = {
        **datos.model_dump(exclude={"historial_medico", "ubicacion"}),
        "ubicacion": datos.ubicacion.model_dump(),
        "estado": "disponible",
        "historial_medico": historial,
        "fundacion_id": fundacion["_id"],
        "fundacion": resumen_fundacion(fundacion),
        "fecha_publicacion": fecha,
        "actualizado_en": fecha,
    }
    mascota["ubicacion"]["coordinates"] = list(mascota["ubicacion"]["coordinates"])
    resultado = await col(MASCOTAS).insert_one(mascota)
    mascota["_id"] = resultado.inserted_id
    return a_json(mascota)


async def actualizar(fundacion: dict[str, Any], mascota_id: str, datos: MascotaUpdate) -> dict[str, Any]:
    actual = await _propia(mascota_id, fundacion)
    cambios = datos.model_dump(exclude_none=True)
    if not cambios:
        return a_json(actual)

    especie = cambios.get("especie", actual["especie"])
    if "especie" in cambios or "atributos_especie" in cambios:
        atributos = cambios.get("atributos_especie")
        if atributos is None:
            error(422, "Al cambiar la especie envíe también sus atributos.")
        cambios["atributos_especie"] = validar_atributos(especie, atributos)
    if "ubicacion" in cambios:
        cambios["ubicacion"]["coordinates"] = list(cambios["ubicacion"]["coordinates"])
    if "temperamento" in cambios:
        cambios["temperamento"] = list(dict.fromkeys(cambios["temperamento"]))
    cambios["actualizado_en"] = ahora()

    mascota = await col(MASCOTAS).find_one_and_update(
        {"_id": actual["_id"]}, {"$set": cambios}, return_document=ReturnDocument.AFTER
    )

    # Mantiene coherentes las copias resumidas guardadas en las solicitudes
    if {"nombre", "especie", "fotos"} & cambios.keys():
        await col(SOLICITUDES).update_many(
            {"mascota_id": mascota["_id"]},
            {"$set": {"mascota": {"nombre": mascota["nombre"], "especie": mascota["especie"], "foto": mascota["fotos"][0]}}},
        )
    return a_json(mascota)


async def agregar_registro_medico(fundacion: dict[str, Any], mascota_id: str, datos: RegistroMedicoIn) -> dict[str, Any]:
    actual = await _propia(mascota_id, fundacion)
    mascota = await col(MASCOTAS).find_one_and_update(
        {"_id": actual["_id"]},
        {
            # $push con $sort: el arreglo embebido queda ordenado del más reciente al más antiguo
            "$push": {"historial_medico": {"$each": [_registro(datos)], "$sort": {"fecha": -1}}},
            "$set": {"actualizado_en": ahora()},
        },
        return_document=ReturnDocument.AFTER,
    )
    return a_json(mascota)


async def subir_foto(fundacion: dict[str, Any], archivo: UploadFile) -> ObjectId:
    tipo = archivo.content_type or ""
    if tipo not in TIPOS_IMAGEN:
        error(422, "El archivo debe ser una imagen (JPG, PNG o WebP).")
    contenido = await archivo.read()
    if len(contenido) > TAMANO_MAXIMO_FOTO:
        error(422, "La imagen supera el tamaño máximo de 8 MB.")
    return await bucket_fotos().upload_from_stream(
        archivo.filename or "foto",
        contenido,
        metadata={"content_type": tipo, "fundacion_id": fundacion["_id"], "subida_en": ahora()},
    )


async def leer_foto(foto_id: str) -> tuple[bytes, str]:
    try:
        flujo = await bucket_fotos().open_download_stream(ObjectId(foto_id))
    except (NoFile, InvalidId, TypeError):
        error(404, "La foto no existe.")
    contenido = await flujo.read()
    tipo = (flujo.metadata or {}).get("content_type", "application/octet-stream")
    return contenido, tipo

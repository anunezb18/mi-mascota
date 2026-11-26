"""Conexión a MongoDB con el driver asíncrono oficial (PyMongo AsyncMongoClient).

Las colecciones, sus validadores $jsonSchema y sus índices los crea el
servicio mongo-setup (database/mongo/setup.js); el backend solo los usa.
"""

from gridfs import AsyncGridFSBucket
from pymongo import AsyncMongoClient
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import settings

USUARIOS = "usuarios"
FUNDACIONES = "fundaciones"
MASCOTAS = "mascotas"
SOLICITUDES = "solicitudes"
NOTIFICACIONES = "notificaciones"
BUCKET_FOTOS = "fotos"

_cliente: AsyncMongoClient | None = None


async def conectar() -> None:
    global _cliente
    # tz_aware: las fechas llegan con zona horaria UTC y se serializan como ISO 8601 con +00:00
    _cliente = AsyncMongoClient(settings.mongo_uri, tz_aware=True, appname="mimascota-backend")
    await _cliente.admin.command("ping")


async def desconectar() -> None:
    global _cliente
    if _cliente is not None:
        await _cliente.close()
        _cliente = None


def cliente() -> AsyncMongoClient:
    if _cliente is None:
        raise RuntimeError("La conexión a MongoDB no está iniciada")
    return _cliente


def db() -> AsyncDatabase:
    return cliente()[settings.mongo_db]


def col(nombre: str) -> AsyncCollection:
    return db()[nombre]


def bucket_fotos() -> AsyncGridFSBucket:
    """GridFS: las fotos subidas por las fundaciones se guardan en fotos.files y fotos.chunks."""
    return AsyncGridFSBucket(db(), bucket_name=BUCKET_FOTOS)

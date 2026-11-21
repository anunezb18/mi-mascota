"""Nombres y accesos a las colecciones de MongoDB.

La validación $jsonSchema y los índices se definen en database/mongo/init/.
"""

from motor.motor_asyncio import AsyncIOMotorCollection

from app.db.mongo.client import get_database

PETS = "pets"


def pets_collection() -> AsyncIOMotorCollection:
    return get_database()[PETS]

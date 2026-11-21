"""Dependencias de acceso a datos para inyectar en las rutas."""

from typing import Annotated

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.client import get_redis
from app.db.mongo.client import get_database
from app.db.postgres.session import get_session

PostgresSession = Annotated[AsyncSession, Depends(get_session)]
MongoDatabase = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
RedisClient = Annotated[Redis, Depends(get_redis)]

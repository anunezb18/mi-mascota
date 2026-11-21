"""Punto de entrada de la API de MiMascota.

Ejecutar en local (desde backend/):  uvicorn app.main:app --reload
Documentación interactiva:           http://localhost:8000/docs
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.routes import health
from app.cache import client as redis_client
from app.core.config import settings
from app.db.mongo import client as mongo_client
from app.db.postgres import session as postgres_session

logging.basicConfig(level=logging.DEBUG if settings.DEBUG else logging.INFO)
logger = logging.getLogger("mimascota")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Abre las conexiones a las tres bases al iniciar y las cierra al apagar."""
    await postgres_session.connect()
    await mongo_client.connect()
    await redis_client.connect()
    logger.info("Clientes de PostgreSQL, MongoDB y Redis inicializados")
    try:
        yield
    finally:
        await redis_client.close()
        await mongo_client.close()
        await postgres_session.close()
        logger.info("Conexiones cerradas")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        description="Plataforma de adopción de mascotas con persistencia políglota "
        "(MongoDB, PostgreSQL y Redis).",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    return app


app = create_app()

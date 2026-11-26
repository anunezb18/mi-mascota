"""MiMascota API: FastAPI + MongoDB (replica set)."""

import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import registrar_manejadores
from app.db.mongo import conectar, desconectar
from app.realtime.change_stream import escuchar_notificaciones
from app.realtime.conexiones import gestor
from app.realtime.router import router as realtime_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    await conectar()
    tarea = asyncio.create_task(escuchar_notificaciones(gestor))
    yield
    tarea.cancel()
    with suppress(asyncio.CancelledError):
        await tarea
    await desconectar()


app = FastAPI(
    title=settings.app_name,
    description="API de MiMascota: adopción de mascotas entre fundaciones y adoptantes de Bogotá.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
registrar_manejadores(app)

app.include_router(api_router, prefix=settings.api_prefix)
app.include_router(realtime_router)

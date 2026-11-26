"""Agrupa los routers de todos los módulos bajo el prefijo de la API (/api)."""

from fastapi import APIRouter

from app.db.mongo import db
from app.modules.admin.router import router as admin
from app.modules.auth.router import router as auth
from app.modules.fundaciones.router import router as fundaciones
from app.modules.mascotas.router import fotos_router, router as mascotas
from app.modules.notificaciones.router import router as notificaciones
from app.modules.recomendaciones.router import router as recomendaciones
from app.modules.solicitudes.router import router as solicitudes
from app.modules.usuarios.router import router as usuarios

api_router = APIRouter()

for modulo in (auth, usuarios, mascotas, fotos_router, recomendaciones, solicitudes, fundaciones, notificaciones, admin):
    api_router.include_router(modulo)


@api_router.get("/health", tags=["Salud"])
async def health():
    await db().command("ping")
    return {"estado": "ok", "mongodb": "conectado"}

import math
from typing import Annotated, Any

from fastapi import APIRouter, Query

from app.api.dependencies.auth import Adoptante
from app.core.errors import error
from app.db.mongo import MASCOTAS, col
from app.shared.serializacion import a_json

from .compatibilidad import calcular

router = APIRouter(prefix="/recomendaciones", tags=["Recomendaciones"])

# Compatibilidad mínima para recomendar una mascota
UMBRAL = 60


def distancia_km(origen: list[float], destino: list[float]) -> float:
    """Distancia entre dos puntos [lng, lat] con la fórmula de Haversine."""
    lng1, lat1, lng2, lat2 = map(math.radians, (*origen, *destino))
    a = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(a))


@router.get("")
async def recomendaciones(usuario: Adoptante, limite: Annotated[int, Query(ge=1, le=50)] = 12):
    perfil = usuario.get("perfil_estilo_vida")
    if not perfil:
        error(409, "Complete su perfil de estilo de vida para recibir recomendaciones.")

    origen = usuario.get("ubicacion", {}).get("coordinates")
    resultados: list[dict[str, Any]] = []
    async for mascota in col(MASCOTAS).find({"estado": {"$ne": "adoptada"}}):
        if origen:
            mascota["distancia_km"] = round(distancia_km(origen, mascota["ubicacion"]["coordinates"]), 2)
        recomendacion = calcular(mascota, perfil)
        if recomendacion["compatibilidad"] >= UMBRAL:
            resultados.append(recomendacion)

    resultados.sort(key=lambda r: (-r["compatibilidad"], r["mascota"].get("distancia_km") or 0))
    return a_json(resultados[:limite])

from fastapi import APIRouter, status

from app.api.dependencies.auth import Adoptante, FundacionAprobada

from . import service
from .schemas import CrearSolicitudIn, ResolverSolicitudIn

router = APIRouter(prefix="/solicitudes", tags=["Solicitudes"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def crear(datos: CrearSolicitudIn, adoptante: Adoptante):
    return await service.crear(adoptante, datos)


@router.get("/mias")
async def mias(adoptante: Adoptante):
    return await service.mias(adoptante)


@router.patch("/{solicitud_id}/resolver")
async def resolver(solicitud_id: str, datos: ResolverSolicitudIn, fundacion: FundacionAprobada):
    """Aprueba o rechaza. Al aprobar, en una sola transacción rechaza las demás pendientes y marca la mascota como adoptada."""
    return await service.resolver(fundacion, solicitud_id, datos)

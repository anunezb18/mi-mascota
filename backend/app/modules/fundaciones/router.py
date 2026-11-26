from fastapi import APIRouter

from app.api.dependencies.auth import FundacionActual
from app.db.mongo import MASCOTAS, SOLICITUDES, col
from app.modules.mascotas.service import construir_filtro
from app.modules.solicitudes import service as solicitudes
from app.shared.serializacion import a_json
from app.shared.tipos import EstadoMascota, Especie

router = APIRouter(prefix="/fundaciones/me", tags=["Fundación"])


@router.get("")
async def mi_fundacion(fundacion: FundacionActual):
    """Fundación de la cuenta, con su estado de validación. Disponible aunque esté pendiente."""
    return a_json(fundacion)


@router.get("/indicadores")
async def indicadores(fundacion: FundacionActual):
    pipeline = [{"$match": {"fundacion_id": fundacion["_id"]}}, {"$group": {"_id": "$estado", "total": {"$sum": 1}}}]
    por_estado = {g["_id"]: g["total"] async for g in await col(MASCOTAS).aggregate(pipeline)}
    pendientes = await col(SOLICITUDES).count_documents({"fundacion_id": fundacion["_id"], "estado": "pendiente"})
    return {
        "mascotas_publicadas": sum(por_estado.values()),
        "mascotas_disponibles": por_estado.get("disponible", 0),
        "mascotas_en_proceso": por_estado.get("en_proceso", 0),
        "mascotas_adoptadas": por_estado.get("adoptada", 0),
        "solicitudes_pendientes": pendientes,
    }


@router.get("/mascotas")
async def mis_mascotas(
    fundacion: FundacionActual,
    q: str | None = None,
    especie: Especie | None = None,
    estado: EstadoMascota | None = None,
):
    """Mascotas propias en cualquier estado (incluye las adoptadas)."""
    filtro = construir_filtro(especie=especie, estado=estado, q=q, incluir_adoptadas=True)
    filtro["fundacion_id"] = fundacion["_id"]
    cursor = col(MASCOTAS).find(filtro).sort("fecha_publicacion", -1)
    return [a_json(m) async for m in cursor]


@router.get("/solicitudes")
async def solicitudes_recibidas(fundacion: FundacionActual):
    return await solicitudes.de_fundacion(fundacion)

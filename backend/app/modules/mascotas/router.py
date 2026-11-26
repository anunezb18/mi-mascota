from typing import Annotated

from fastapi import APIRouter, File, Query, Request, Response, UploadFile, status

from app.api.dependencies.auth import FundacionAprobada
from app.shared.tipos import EstadoMascota, EtapaVida, Especie, Tamano, Temperamento

from . import service
from .schemas import MascotaIn, MascotaUpdate, RegistroMedicoIn

router = APIRouter(prefix="/mascotas", tags=["Mascotas"])
fotos_router = APIRouter(prefix="/fotos", tags=["Mascotas"])


@router.get("")
async def catalogo(
    especie: Especie | None = None,
    tamano: Tamano | None = None,
    etapa: EtapaVida | None = None,
    temperamento: Annotated[list[Temperamento] | None, Query()] = None,
    lat: Annotated[float | None, Query(ge=-90, le=90)] = None,
    lng: Annotated[float | None, Query(ge=-180, le=180)] = None,
    radio_km: Annotated[float, Query(gt=0, le=100)] = 10,
    estado: EstadoMascota | None = None,
    q: str | None = None,
    limite: Annotated[int | None, Query(ge=1, le=100)] = None,
):
    """Catálogo público. Sin `estado` excluye las adoptadas. Con `lat` y `lng` usa $geoNear."""
    filtro = service.construir_filtro(
        especie=especie, tamano=tamano, etapa=etapa, temperamento=temperamento, estado=estado, q=q
    )
    return await service.listar_catalogo(filtro, lat=lat, lng=lng, radio_km=radio_km, limite=limite)


@router.post("", status_code=status.HTTP_201_CREATED)
async def crear(datos: MascotaIn, fundacion: FundacionAprobada):
    return await service.crear(fundacion, datos)


@router.post("/fotos", status_code=status.HTTP_201_CREATED)
async def subir_foto(request: Request, fundacion: FundacionAprobada, archivo: Annotated[UploadFile, File()]):
    foto_id = await service.subir_foto(fundacion, archivo)
    return {"url": str(request.url_for("obtener_foto", foto_id=str(foto_id)))}


@router.get("/{mascota_id}")
async def detalle(mascota_id: str):
    return await service.obtener(mascota_id)


@router.patch("/{mascota_id}")
async def actualizar(mascota_id: str, datos: MascotaUpdate, fundacion: FundacionAprobada):
    return await service.actualizar(fundacion, mascota_id, datos)


@router.post("/{mascota_id}/historial-medico", status_code=status.HTTP_201_CREATED)
async def agregar_registro_medico(mascota_id: str, datos: RegistroMedicoIn, fundacion: FundacionAprobada):
    return await service.agregar_registro_medico(fundacion, mascota_id, datos)


@fotos_router.get("/{foto_id}", name="obtener_foto")
async def obtener_foto(foto_id: str):
    """Sirve una foto guardada en GridFS."""
    contenido, tipo = await service.leer_foto(foto_id)
    return Response(content=contenido, media_type=tipo, headers={"Cache-Control": "public, max-age=31536000, immutable"})

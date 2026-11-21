"""Mascotas: búsqueda (con caché y cercanía) y gestión por parte de fundaciones."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.errors import not_implemented
from app.core.roles import UserRole
from app.dependencies.auth import require_roles
from app.dependencies.db import MongoDatabase, PostgresSession, RedisClient
from app.schemas.auth import CurrentUser
from app.schemas.pet import MedicalRecord, PetCreate, PetRead, PetStatus, PetUpdate, Species

router = APIRouter()

FoundationUser = Annotated[CurrentUser, Depends(require_roles(UserRole.FOUNDATION))]


@router.get("", response_model=list[PetRead])
async def search_pets(
    db: MongoDatabase,
    redis: RedisClient,
    species: Species | None = None,
    pet_status: Annotated[PetStatus, Query(alias="status")] = PetStatus.AVAILABLE,
    lat: Annotated[float | None, Query(ge=-90, le=90)] = None,
    lng: Annotated[float | None, Query(ge=-180, le=180)] = None,
    radius_km: Annotated[float, Query(gt=0, le=200)] = 10,
    limit: Annotated[int, Query(gt=0, le=100)] = 20,
) -> list[PetRead]:
    """Busca mascotas por especie, estado y cercanía (índice 2dsphere).

    TODO: pet_service.search_pets(db, redis, ...)  (usa caché en Redis)
    """
    raise not_implemented()


@router.get("/{pet_id}", response_model=PetRead)
async def get_pet(pet_id: str, db: MongoDatabase) -> PetRead:
    """TODO: pet_service.get_pet(...) y 404 si no existe."""
    raise not_implemented()


@router.post("", response_model=PetRead, status_code=status.HTTP_201_CREATED)
async def create_pet(
    data: PetCreate,
    db: MongoDatabase,
    redis: RedisClient,
    session: PostgresSession,
    user: FoundationUser,
) -> PetRead:
    """Registra una mascota de la fundación del usuario autenticado.

    TODO: obtener foundation_id desde PostgreSQL y llamar a pet_service.create_pet(...)
    """
    raise not_implemented()


@router.patch("/{pet_id}", response_model=PetRead)
async def update_pet(
    pet_id: str,
    data: PetUpdate,
    db: MongoDatabase,
    redis: RedisClient,
    session: PostgresSession,
    user: FoundationUser,
) -> PetRead:
    """TODO: pet_service.update_pet(...)."""
    raise not_implemented()


@router.post("/{pet_id}/medical-history", response_model=PetRead)
async def add_medical_record(
    pet_id: str,
    record: MedicalRecord,
    db: MongoDatabase,
    session: PostgresSession,
    user: FoundationUser,
) -> PetRead:
    """Agrega una entrada al historial médico anidado.

    TODO: pet_service.add_medical_record(...)
    """
    raise not_implemented()

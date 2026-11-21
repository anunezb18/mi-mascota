"""Gestión y búsqueda de mascotas (MongoDB + caché en Redis)."""

from motor.motor_asyncio import AsyncIOMotorDatabase
from redis.asyncio import Redis

from app.schemas.pet import MedicalRecord, PetCreate, PetRead, PetStatus, PetUpdate, Species


async def search_pets(
    db: AsyncIOMotorDatabase,
    redis: Redis,
    *,
    species: Species | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float = 10,
    status: PetStatus = PetStatus.AVAILABLE,
    limit: int = 20,
) -> list[PetRead]:
    """TODO (cache-aside):
    1. key = build_search_key(...) y devolver get_cached(...) si existe.
    2. Si hay lat/lng, usar $geoNear (índice 2dsphere) con maxDistance=radius_km*1000
       para obtener también distance_km; si no, find() con los filtros.
    3. Guardar el resultado con set_cached(...) y devolverlo.
    """
    raise NotImplementedError


async def get_pet(db: AsyncIOMotorDatabase, pet_id: str) -> PetRead | None:
    """TODO: buscar por ObjectId (validar con bson.ObjectId.is_valid)."""
    raise NotImplementedError


async def create_pet(
    db: AsyncIOMotorDatabase, redis: Redis, foundation_id: int, data: PetCreate
) -> PetRead:
    """TODO: insertar con status='available' y created_at; invalidar caché de búsquedas.
    MongoDB rechazará el documento si no cumple el $jsonSchema (WriteError)."""
    raise NotImplementedError


async def update_pet(
    db: AsyncIOMotorDatabase, redis: Redis, pet_id: str, foundation_id: int, data: PetUpdate
) -> PetRead | None:
    """TODO: $set solo de los campos enviados (exclude_unset), verificando que la
    mascota pertenezca a la fundación; actualizar updated_at; invalidar caché."""
    raise NotImplementedError


async def add_medical_record(
    db: AsyncIOMotorDatabase, pet_id: str, foundation_id: int, record: MedicalRecord
) -> PetRead | None:
    """TODO: $push al arreglo anidado medical_history."""
    raise NotImplementedError


async def set_pet_status(db: AsyncIOMotorDatabase, redis: Redis, pet_id: str, status: PetStatus) -> None:
    """TODO: cambiar el estado (la usa adoption_service al aprobar una adopción)."""
    raise NotImplementedError

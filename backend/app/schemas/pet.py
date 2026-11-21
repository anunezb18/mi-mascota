"""Esquemas de mascotas (documentos de MongoDB).

Deben mantenerse alineados con el $jsonSchema de database/mongo/init/01-pets.js.
"""

from datetime import datetime
from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class Species(StrEnum):
    DOG = "dog"
    CAT = "cat"
    OTHER = "other"


class PetSex(StrEnum):
    MALE = "male"
    FEMALE = "female"
    UNKNOWN = "unknown"


class PetStatus(StrEnum):
    AVAILABLE = "available"
    IN_PROCESS = "in_process"
    ADOPTED = "adopted"


class GeoPoint(BaseModel):
    """Punto GeoJSON. coordinates = [longitud, latitud]."""

    type: Literal["Point"] = "Point"
    coordinates: tuple[float, float]

    @field_validator("coordinates")
    @classmethod
    def validate_range(cls, value: tuple[float, float]) -> tuple[float, float]:
        lng, lat = value
        if not (-180 <= lng <= 180 and -90 <= lat <= 90):
            raise ValueError("Coordenadas fuera de rango: [longitud, latitud]")
        return value


class MedicalRecord(BaseModel):
    date: datetime
    type: str = Field(description="vacuna, desparasitación, cirugía, etc.")
    description: str
    veterinarian: str | None = None


class PetBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    species: Species
    breed: str | None = None
    sex: PetSex = PetSex.UNKNOWN
    age_months: int | None = Field(default=None, ge=0)
    description: str | None = Field(default=None, max_length=2000)
    # Estructura variable según la especie
    attributes: dict[str, Any] = Field(default_factory=dict)
    location: GeoPoint
    photos: list[str] = Field(default_factory=list)


class PetCreate(PetBase):
    medical_history: list[MedicalRecord] = Field(default_factory=list)


class PetUpdate(BaseModel):
    """Actualización parcial: solo se envían los campos a modificar."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    breed: str | None = None
    sex: PetSex | None = None
    age_months: int | None = Field(default=None, ge=0)
    description: str | None = Field(default=None, max_length=2000)
    attributes: dict[str, Any] | None = None
    location: GeoPoint | None = None
    photos: list[str] | None = None
    status: PetStatus | None = None


class PetRead(PetBase):
    id: str = Field(description="ObjectId en formato hexadecimal")
    foundation_id: int
    status: PetStatus
    medical_history: list[MedicalRecord] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime | None = None
    distance_km: float | None = Field(
        default=None, description="Solo en búsquedas por cercanía"
    )

"""Esquemas de solicitudes de adopción y adopciones."""

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

OBJECT_ID_PATTERN = r"^[0-9a-f]{24}$"


class AdoptionRequestStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class AdoptionRequestCreate(BaseModel):
    pet_id: str = Field(pattern=OBJECT_ID_PATTERN)
    message: str | None = Field(default=None, max_length=2000)


class AdoptionRequestReview(BaseModel):
    """Decisión de la fundación sobre una solicitud."""

    status: Literal[AdoptionRequestStatus.APPROVED, AdoptionRequestStatus.REJECTED]
    notes: str | None = None


class AdoptionRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    adopter_id: int
    foundation_id: int
    pet_id: str
    status: AdoptionRequestStatus
    message: str | None
    created_at: datetime
    updated_at: datetime


class AdoptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: int
    adopter_id: int
    foundation_id: int
    pet_id: str
    adopted_at: datetime
    notes: str | None

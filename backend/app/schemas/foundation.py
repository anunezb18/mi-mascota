"""Esquemas de fundaciones."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FoundationBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    nit: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    description: str | None = None


class FoundationCreate(FoundationBase):
    pass


class FoundationRead(FoundationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    is_verified: bool
    created_at: datetime

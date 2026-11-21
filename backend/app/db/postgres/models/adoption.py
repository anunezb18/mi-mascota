"""Tablas adoption_requests y adoptions. Deben coincidir con 01-schema.sql.

pet_id guarda el ObjectId (hex de 24 caracteres) de la mascota en MongoDB.
"""

from datetime import datetime

from sqlalchemy import (
    CHAR,
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres.base import Base


class AdoptionRequest(Base):
    __tablename__ = "adoption_requests"
    __table_args__ = (
        CheckConstraint("pet_id ~ '^[0-9a-f]{24}$'", name="pet_id"),
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected', 'cancelled')", name="status"
        ),
        # Una sola solicitud pendiente por adoptante y mascota
        Index(
            "uq_adoption_requests_pending",
            "adopter_id",
            "pet_id",
            unique=True,
            postgresql_where=text("status = 'pending'"),
        ),
        Index("ix_adoption_requests_foundation_status", "foundation_id", "status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    adopter_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    foundation_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("foundations.id", ondelete="RESTRICT"), nullable=False
    )
    pet_id: Mapped[str] = mapped_column(CHAR(24), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pending")
    message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Adoption(Base):
    __tablename__ = "adoptions"
    __table_args__ = (
        CheckConstraint("pet_id ~ '^[0-9a-f]{24}$'", name="pet_id"),
        Index("ix_adoptions_pet_id", "pet_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    request_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("adoption_requests.id", ondelete="RESTRICT"),
        unique=True,
        nullable=False,
    )
    adopter_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    foundation_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("foundations.id", ondelete="RESTRICT"), nullable=False
    )
    pet_id: Mapped[str] = mapped_column(CHAR(24), nullable=False)
    adopted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    notes: Mapped[str | None] = mapped_column(Text)

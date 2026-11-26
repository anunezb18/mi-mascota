"""Conversión entre documentos BSON y JSON de la API."""

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from app.core.errors import error


def a_json(valor: Any) -> Any:
    """ObjectId -> cadena hexadecimal y datetime -> ISO 8601 (UTC), de forma recursiva."""
    if isinstance(valor, ObjectId):
        return str(valor)
    if isinstance(valor, datetime):
        return (valor if valor.tzinfo else valor.replace(tzinfo=UTC)).isoformat()
    if isinstance(valor, dict):
        return {k: a_json(v) for k, v in valor.items()}
    if isinstance(valor, (list, tuple)):
        return [a_json(v) for v in valor]
    return valor


def oid(valor: str, recurso: str = "El recurso") -> ObjectId:
    """Convierte un id de la URL; un id mal formado se trata como inexistente (404)."""
    if not ObjectId.is_valid(valor):
        error(404, f"{recurso} no existe.")
    return ObjectId(valor)


def sin_nulos(documento: dict[str, Any]) -> dict[str, Any]:
    """Quita los campos None: los validadores no admiten null en campos opcionales."""
    return {k: v for k, v in documento.items() if v is not None}


def ahora() -> datetime:
    return datetime.now(UTC)

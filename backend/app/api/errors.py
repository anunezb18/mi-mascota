"""Errores HTTP comunes."""

from fastapi import HTTPException, status


def not_implemented() -> HTTPException:
    """Respuesta 501 para endpoints definidos pero aún no implementados."""
    return HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint pendiente de implementación",
    )

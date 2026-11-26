from typing import Annotated, Literal

from pydantic import StringConstraints

from app.shared.tipos import Entrada


class CrearSolicitudIn(Entrada):
    mascota_id: str
    mensaje: Annotated[str, StringConstraints(strip_whitespace=True, min_length=20, max_length=1000)]


class ResolverSolicitudIn(Entrada):
    estado: Literal["aprobada", "rechazada"]
    nota: Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)] | None = None

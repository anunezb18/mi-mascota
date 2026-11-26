from typing import Annotated, Literal

from pydantic import StringConstraints

from app.shared.tipos import Entrada


class ValidarFundacionIn(Entrada):
    estado_validacion: Literal["aprobada", "rechazada"]
    motivo_rechazo: Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)] | None = None


class CambiarEstadoUsuarioIn(Entrada):
    activo: bool

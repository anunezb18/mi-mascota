from typing import Annotated

from pydantic import Field, StringConstraints, field_validator

from app.modules.auth.schemas import validar_contrasena
from app.shared.tipos import Entrada, Especie, Tamano, TipoVivienda


class ActualizarCuentaIn(Entrada):
    nombre: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=120)] | None = None
    # Cadena vacía = quitar el dato
    telefono: Annotated[str, StringConstraints(strip_whitespace=True, pattern=r"^$|^(3\d{9}|60\d{8})$")] | None = None
    ciudad: Annotated[str, StringConstraints(strip_whitespace=True, max_length=80)] | None = None


class CambiarContrasenaIn(Entrada):
    contrasena_actual: str
    contrasena_nueva: str

    _nueva = field_validator("contrasena_nueva")(validar_contrasena)


class PerfilEstiloVidaIn(Entrada):
    tipo_vivienda: TipoVivienda
    tiene_patio: bool
    horas_disponibles: Annotated[int, Field(ge=0, le=24)]
    tiene_ninos: bool
    tiene_otras_mascotas: bool
    otras_mascotas: list[Especie]
    experiencia_previa: bool
    especies_preferidas: list[Especie]
    tamanos_preferidos: list[Tamano]

    @field_validator("otras_mascotas", "especies_preferidas", "tamanos_preferidos")
    @classmethod
    def sin_repetidos(cls, valores: list[str]) -> list[str]:
        return list(dict.fromkeys(valores))

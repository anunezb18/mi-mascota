from datetime import UTC, datetime, timedelta
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

from app.shared.tipos import Entrada, Especie, GeoPunto, Sexo, Tamano, Temperamento, TipoRegistroMedico


class _Atributos(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AtributosPerro(_Atributos):
    nivel_energia: Literal["bajo", "medio", "alto"]
    necesita_patio: bool
    apto_con_ninos: bool
    apto_con_gatos: bool
    entrenado: bool


class AtributosGato(_Atributos):
    usa_arenero: bool
    apto_con_perros: bool
    apto_con_ninos: bool
    solo_interior: bool


class AtributosConejo(_Atributos):
    usa_arenero: bool
    tipo_pelaje: Literal["corto", "largo"]
    apto_con_ninos: bool
    requiere_jaula_amplia: bool


ATRIBUTOS_POR_ESPECIE: dict[str, type[_Atributos]] = {
    "perro": AtributosPerro,
    "gato": AtributosGato,
    "conejo": AtributosConejo,
}


def validar_atributos(especie: str, atributos: dict[str, Any]) -> dict[str, Any]:
    """Los atributos son polimórficos: su forma depende de la especie."""
    return ATRIBUTOS_POR_ESPECIE[especie].model_validate(atributos).model_dump()


class RegistroMedicoIn(Entrada):
    fecha: datetime
    tipo: TipoRegistroMedico
    descripcion: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=300)]
    veterinario: Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)] | None = None

    @field_validator("fecha")
    @classmethod
    def no_futura(cls, fecha: datetime) -> datetime:
        fecha = fecha if fecha.tzinfo else fecha.replace(tzinfo=UTC)
        # Margen de un día: el frontend envía la fecha elegida a las 12:00 hora local
        if fecha > datetime.now(UTC) + timedelta(days=1):
            raise ValueError("La fecha no puede ser posterior a hoy.")
        return fecha


Nombre = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=60)]
Raza = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)]
Descripcion = Annotated[str, StringConstraints(strip_whitespace=True, min_length=40, max_length=2000)]
EdadMeses = Annotated[int, Field(ge=1, le=372)]
Temperamentos = Annotated[list[Temperamento], Field(min_length=1, max_length=4)]
Fotos = Annotated[list[Annotated[str, StringConstraints(min_length=1)]], Field(min_length=1, max_length=6)]


class MascotaIn(Entrada):
    nombre: Nombre
    especie: Especie
    raza: Raza
    sexo: Sexo
    edad_meses: EdadMeses
    tamano: Tamano
    descripcion: Descripcion
    temperamento: Temperamentos
    fotos: Fotos
    esterilizado: bool
    atributos_especie: dict[str, Any]
    historial_medico: list[RegistroMedicoIn] = []
    ubicacion: GeoPunto

    @model_validator(mode="after")
    def atributos_de_la_especie(self) -> "MascotaIn":
        self.atributos_especie = validar_atributos(self.especie, self.atributos_especie)
        self.temperamento = list(dict.fromkeys(self.temperamento))
        return self


class MascotaUpdate(Entrada):
    """Edición parcial. El estado no se edita: lo cambian las reglas de las solicitudes."""

    nombre: Nombre | None = None
    especie: Especie | None = None
    raza: Raza | None = None
    sexo: Sexo | None = None
    edad_meses: EdadMeses | None = None
    tamano: Tamano | None = None
    descripcion: Descripcion | None = None
    temperamento: Temperamentos | None = None
    fotos: Fotos | None = None
    esterilizado: bool | None = None
    atributos_especie: dict[str, Any] | None = None
    ubicacion: GeoPunto | None = None

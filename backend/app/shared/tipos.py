"""Tipos compartidos por los esquemas de entrada (Pydantic)."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Rol = Literal["adoptante", "fundacion", "administrador"]
Especie = Literal["perro", "gato", "conejo"]
Sexo = Literal["macho", "hembra"]
Tamano = Literal["pequeno", "mediano", "grande"]
EstadoMascota = Literal["disponible", "en_proceso", "adoptada"]
EtapaVida = Literal["cachorro", "joven", "adulto", "senior"]
EstadoSolicitud = Literal["pendiente", "aprobada", "rechazada"]
EstadoValidacion = Literal["pendiente", "aprobada", "rechazada"]
TipoVivienda = Literal["apartamento", "casa", "finca"]
Temperamento = Literal["tranquilo", "jugueton", "sociable", "carinoso", "timido", "independiente", "activo", "protector"]
TipoRegistroMedico = Literal["vacuna", "desparasitacion", "esterilizacion", "consulta", "cirugia", "tratamiento"]

Texto = Annotated[str, StringConstraints(strip_whitespace=True)]
Telefono = Annotated[str, StringConstraints(strip_whitespace=True, pattern=r"^(3\d{9}|60\d{8})$")]

# Rango de edad en meses de cada etapa: [mínimo, máximo)
ETAPA_RANGO_MESES: dict[str, tuple[int, int | None]] = {
    "cachorro": (0, 12),
    "joven": (12, 36),
    "adulto": (36, 96),
    "senior": (96, None),
}


class Entrada(BaseModel):
    """Base de los cuerpos de petición: rechaza campos desconocidos."""

    model_config = ConfigDict(extra="forbid")


class GeoPunto(Entrada):
    type: Literal["Point"]
    # [longitud, latitud], el orden que exige el índice 2dsphere
    coordinates: tuple[
        Annotated[float, Field(ge=-180, le=180)],
        Annotated[float, Field(ge=-90, le=90)],
    ]

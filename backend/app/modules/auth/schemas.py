from typing import Annotated, Literal

from pydantic import EmailStr, Field, StringConstraints, field_validator

from app.shared.tipos import Entrada, Telefono, Texto


def validar_contrasena(valor: str) -> str:
    if len(valor) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres.")
    if len(valor.encode("utf-8")) > 72:
        raise ValueError("La contraseña no puede superar 72 caracteres.")
    if not any(c.isalpha() for c in valor) or not any(c.isdigit() for c in valor):
        raise ValueError("La contraseña debe incluir letras y números.")
    return valor


class LoginIn(Entrada):
    correo: Annotated[str, StringConstraints(strip_whitespace=True, to_lower=True, min_length=3)]
    contrasena: str


class _CuentaBase(Entrada):
    nombre: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=120)]
    correo: EmailStr
    contrasena: str

    _contrasena = field_validator("contrasena")(validar_contrasena)


class RegistroAdoptanteIn(_CuentaBase):
    rol: Literal["adoptante"]
    telefono: Telefono | None = None
    ciudad: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)] | None = None


class FundacionRegistroIn(Entrada):
    nombre: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=150)]
    nit: Texto
    descripcion: Annotated[str, StringConstraints(strip_whitespace=True, min_length=40, max_length=1000)]
    direccion: Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=200)]
    ciudad: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)]
    localidad: Annotated[str, StringConstraints(strip_whitespace=True, max_length=80)] | None = None
    sitio_web: Annotated[str, StringConstraints(strip_whitespace=True, pattern=r"^https?://")] | None = None


class RegistroFundacionIn(_CuentaBase):
    rol: Literal["fundacion"]
    telefono: Telefono
    fundacion: FundacionRegistroIn


RegistroIn = Annotated[RegistroAdoptanteIn | RegistroFundacionIn, Field(discriminator="rol")]

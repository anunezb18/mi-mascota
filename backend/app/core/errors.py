"""Errores de la API con el formato que espera el frontend: { "detail": "mensaje en español" }."""

import logging
from typing import NoReturn

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pymongo.errors import DuplicateKeyError, WriteError

log = logging.getLogger("mimascota")

# Código de MongoDB cuando un documento no cumple el validador $jsonSchema
DOCUMENTO_INVALIDO = 121


def error(codigo: int, mensaje: str) -> NoReturn:
    raise HTTPException(status_code=codigo, detail=mensaje)


def _campo(loc: tuple) -> str:
    partes = [str(p) for p in loc if p not in ("body", "query", "path")]
    return ".".join(partes) or "solicitud"


async def _validacion(_: Request, exc: RequestValidationError) -> JSONResponse:
    primero = exc.errors()[0] if exc.errors() else {"loc": (), "msg": "Datos inválidos"}
    mensaje = str(primero.get("msg", "Datos inválidos")).removeprefix("Value error, ")
    return JSONResponse(
        status_code=422,
        content={"detail": f"Revise el campo «{_campo(tuple(primero.get('loc', ())))}»: {mensaje}"},
    )


async def _duplicado(_: Request, exc: DuplicateKeyError) -> JSONResponse:
    log.info("Clave duplicada: %s", exc.details)
    return JSONResponse(status_code=409, content={"detail": "Ya existe un registro con esos datos."})


async def _escritura(_: Request, exc: WriteError) -> JSONResponse:
    if exc.code == DOCUMENTO_INVALIDO:
        # El validador $jsonSchema de la colección rechazó el documento
        log.warning("Documento rechazado por el esquema: %s", exc.details)
        return JSONResponse(
            status_code=422,
            content={"detail": "Los datos no cumplen el esquema de la base de datos."},
        )
    log.exception("Error de escritura en MongoDB")
    return JSONResponse(status_code=500, content={"detail": "No fue posible guardar los datos. Intente de nuevo."})


def registrar_manejadores(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, _validacion)  # type: ignore[arg-type]
    app.add_exception_handler(DuplicateKeyError, _duplicado)  # type: ignore[arg-type]
    app.add_exception_handler(WriteError, _escritura)  # type: ignore[arg-type]

from typing import Any

from pymongo import ReturnDocument

from app.core.errors import error
from app.core.security import hash_contrasena, verificar_contrasena
from app.db.mongo import SOLICITUDES, USUARIOS, col
from app.shared.serializacion import a_json, ahora

from .schemas import ActualizarCuentaIn, CambiarContrasenaIn, PerfilEstiloVidaIn

# Nunca se expone el hash de la contraseña
PROYECCION_PUBLICA = {"contrasena_hash": 0}


def usuario_publico(usuario: dict[str, Any]) -> dict[str, Any]:
    return a_json({k: v for k, v in usuario.items() if k != "contrasena_hash"})


async def actualizar_cuenta(usuario: dict[str, Any], datos: ActualizarCuentaIn) -> dict[str, Any]:
    asignar: dict[str, Any] = {}
    quitar: dict[str, str] = {}
    if datos.nombre is not None:
        asignar["nombre"] = datos.nombre
    for campo in ("telefono", "ciudad"):
        valor = getattr(datos, campo)
        if valor is None:
            continue
        if valor:
            asignar[campo] = valor
        else:
            quitar[campo] = ""
    if usuario["rol"] == "fundacion" and "telefono" in quitar:
        error(422, "El teléfono es obligatorio para las cuentas de fundación.")

    cambios: dict[str, Any] = {}
    if asignar:
        cambios["$set"] = asignar
    if quitar:
        cambios["$unset"] = quitar
    if not cambios:
        return usuario_publico(usuario)

    actualizado = await col(USUARIOS).find_one_and_update(
        {"_id": usuario["_id"]}, cambios, return_document=ReturnDocument.AFTER
    )

    # Patrón de subconjunto: las solicitudes guardan una copia de los datos del adoptante
    if usuario["rol"] == "adoptante":
        copia_set = {f"adoptante.{k}": v for k, v in asignar.items()}
        copia_unset = {f"adoptante.{k}": "" for k in quitar}
        actualizacion: dict[str, Any] = {}
        if copia_set:
            actualizacion["$set"] = copia_set
        if copia_unset:
            actualizacion["$unset"] = copia_unset
        await col(SOLICITUDES).update_many({"adoptante_id": usuario["_id"]}, actualizacion)

    return usuario_publico(actualizado)


async def cambiar_contrasena(usuario: dict[str, Any], datos: CambiarContrasenaIn) -> None:
    if not verificar_contrasena(datos.contrasena_actual, usuario["contrasena_hash"]):
        error(400, "La contraseña actual no es correcta.")
    if datos.contrasena_actual == datos.contrasena_nueva:
        error(400, "La nueva contraseña debe ser diferente de la actual.")
    await col(USUARIOS).update_one(
        {"_id": usuario["_id"]}, {"$set": {"contrasena_hash": hash_contrasena(datos.contrasena_nueva)}}
    )


async def guardar_perfil(usuario: dict[str, Any], datos: PerfilEstiloVidaIn) -> dict[str, Any]:
    perfil = datos.model_dump()
    if not perfil["tiene_otras_mascotas"]:
        perfil["otras_mascotas"] = []
    perfil["actualizado_en"] = ahora()
    actualizado = await col(USUARIOS).find_one_and_update(
        {"_id": usuario["_id"]}, {"$set": {"perfil_estilo_vida": perfil}}, return_document=ReturnDocument.AFTER
    )
    return usuario_publico(actualizado)

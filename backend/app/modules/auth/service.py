from typing import Any

from bson import ObjectId

from app.core.errors import error
from app.core.security import crear_token, hash_contrasena, verificar_contrasena
from app.db.mongo import FUNDACIONES, USUARIOS, cliente, col
from app.modules.fundaciones.nit import nit_valido, normalizar_nit
from app.modules.notificaciones.service import notificar_administradores
from app.modules.usuarios.service import usuario_publico
from app.shared.serializacion import ahora, sin_nulos

from .schemas import LoginIn, RegistroAdoptanteIn, RegistroFundacionIn


def _respuesta(usuario: dict[str, Any]) -> dict[str, Any]:
    return {
        "access_token": crear_token(str(usuario["_id"]), usuario["rol"]),
        "token_type": "bearer",
        "usuario": usuario_publico(usuario),
    }


async def login(datos: LoginIn) -> dict[str, Any]:
    usuario = await col(USUARIOS).find_one({"correo": datos.correo})
    if not usuario or not verificar_contrasena(datos.contrasena, usuario["contrasena_hash"]):
        error(401, "Correo o contraseña incorrectos.")
    if not usuario["activo"]:
        error(403, "Su cuenta está desactivada. Comuníquese con el administrador.")
    return _respuesta(usuario)


async def registrar(datos: RegistroAdoptanteIn | RegistroFundacionIn) -> dict[str, Any]:
    correo = datos.correo.lower()
    if await col(USUARIOS).count_documents({"correo": correo}, limit=1):
        error(409, "Ya existe una cuenta registrada con este correo electrónico.")

    fecha = ahora()
    usuario: dict[str, Any] = sin_nulos(
        {
            "_id": ObjectId(),
            "nombre": datos.nombre,
            "correo": correo,
            "contrasena_hash": hash_contrasena(datos.contrasena),
            "telefono": datos.telefono,
            "rol": datos.rol,
            "activo": True,
            "ciudad": datos.ciudad if isinstance(datos, RegistroAdoptanteIn) else datos.fundacion.ciudad,
            "fecha_registro": fecha,
        }
    )

    if isinstance(datos, RegistroAdoptanteIn):
        await col(USUARIOS).insert_one(usuario)
        return _respuesta(usuario)

    f = datos.fundacion
    nit = normalizar_nit(f.nit)
    if nit is None:
        error(422, "Ingrese el NIT con dígito de verificación (ej. 901.234.567-1).")
    if not nit_valido(nit):
        error(422, "El dígito de verificación del NIT no es válido.")
    if await col(FUNDACIONES).count_documents({"nit": nit}, limit=1):
        error(409, "Ya existe una fundación registrada con este NIT.")

    fundacion = sin_nulos(
        {
            "_id": ObjectId(),
            "usuario_id": usuario["_id"],
            "nombre": f.nombre,
            "nit": nit,
            "descripcion": f.descripcion,
            "direccion": f.direccion,
            "ciudad": f.ciudad,
            "localidad": f.localidad or None,
            "telefono": datos.telefono,
            "correo": correo,
            "sitio_web": f.sitio_web or None,
            "estado_validacion": "pendiente",
            "fecha_registro": fecha,
        }
    )
    usuario["fundacion_id"] = fundacion["_id"]

    # Usuario, fundación y aviso al administrador se guardan juntos o no se guarda nada
    async def transaccion(session):
        await col(USUARIOS).insert_one(usuario, session=session)
        await col(FUNDACIONES).insert_one(fundacion, session=session)
        await notificar_administradores(
            "fundacion_pendiente",
            "Fundación pendiente de validación",
            f"{fundacion['nombre']} (NIT {nit}) se registró y espera la verificación de sus datos.",
            "/admin/fundaciones",
            session=session,
        )

    async with cliente().start_session() as session:
        await session.with_transaction(transaccion)
    return _respuesta(usuario)

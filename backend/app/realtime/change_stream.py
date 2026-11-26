"""Change stream sobre la colección notificaciones.

Cada notificación insertada (por cualquier proceso, incluso dentro de una
transacción, en cuyo caso llega al confirmarse) se reenvía por WebSocket a las
conexiones abiertas de su destinatario. Requiere el replica set de MongoDB.
"""

import asyncio
import logging
from typing import Any

from app.db.mongo import NOTIFICACIONES, col
from app.shared.serializacion import a_json

from .conexiones import GestorConexiones

log = logging.getLogger("mimascota.realtime")


async def escuchar_notificaciones(gestor: GestorConexiones) -> None:
    token_reanudacion: Any = None
    while True:
        try:
            async with await col(NOTIFICACIONES).watch(
                [{"$match": {"operationType": "insert"}}],
                resume_after=token_reanudacion,
            ) as flujo:
                log.info("Change stream de notificaciones activo")
                async for cambio in flujo:
                    token_reanudacion = cambio["_id"]
                    notificacion = cambio["fullDocument"]
                    await gestor.enviar(
                        str(notificacion["usuario_id"]),
                        {"evento": "notificacion", "datos": a_json(notificacion)},
                    )
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001 - se reintenta y se reanuda desde el último evento
            log.exception("El change stream se interrumpió; se reintenta en 3 s")
            await asyncio.sleep(3)

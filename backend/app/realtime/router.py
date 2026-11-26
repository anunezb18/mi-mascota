from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.api.dependencies.auth import cargar_usuario_activo
from app.core.security import decodificar_token

from .conexiones import gestor

router = APIRouter(tags=["Tiempo real"])

# Código de cierre que el frontend interpreta como "token inválido: no reintentar"
TOKEN_INVALIDO = 4401


@router.websocket("/ws/notificaciones")
async def notificaciones(websocket: WebSocket, token: str | None = None):
    """Canal de notificaciones en tiempo real: ws://<host>/ws/notificaciones?token=<JWT>."""
    await websocket.accept()
    usuario = await cargar_usuario_activo(decodificar_token(token))
    if usuario is None:
        await websocket.close(code=TOKEN_INVALIDO, reason="Token inválido o vencido")
        return

    usuario_id = str(usuario["_id"])
    gestor.agregar(usuario_id, websocket)
    try:
        while True:
            # El cliente no envía mensajes; se lee para detectar la desconexión
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        gestor.quitar(usuario_id, websocket)

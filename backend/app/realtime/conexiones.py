"""Registro de los WebSocket abiertos, agrupados por usuario."""

import logging
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

log = logging.getLogger("mimascota.realtime")


class GestorConexiones:
    def __init__(self) -> None:
        self._por_usuario: dict[str, set[WebSocket]] = defaultdict(set)

    def agregar(self, usuario_id: str, websocket: WebSocket) -> None:
        self._por_usuario[usuario_id].add(websocket)

    def quitar(self, usuario_id: str, websocket: WebSocket) -> None:
        conexiones = self._por_usuario.get(usuario_id)
        if conexiones is not None:
            conexiones.discard(websocket)
            if not conexiones:
                del self._por_usuario[usuario_id]

    async def enviar(self, usuario_id: str, mensaje: dict[str, Any]) -> None:
        """Envía a todas las pestañas abiertas del usuario; descarta las conexiones caídas."""
        for websocket in list(self._por_usuario.get(usuario_id, ())):
            try:
                await websocket.send_json(mensaje)
            except Exception:  # noqa: BLE001 - una conexión rota no debe afectar a las demás
                log.info("Conexión cerrada para el usuario %s", usuario_id)
                self.quitar(usuario_id, websocket)

    @property
    def total(self) -> int:
        return sum(len(c) for c in self._por_usuario.values())


gestor = GestorConexiones()

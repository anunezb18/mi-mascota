import type { NotificacionesService } from "@/features/notificaciones/services/notificaciones.service";

import { db, persist } from "../db";
import { subscribeMockNotifications } from "../realtime";
import { currentUser } from "../session";
import { programarActividadSimulada } from "../simulador";
import { clone, delay, fail } from "../utils";

const propias = (usuarioId: string) => db.notificaciones.filter((n) => n.usuario_id === usuarioId);

export const notificacionesMock: NotificacionesService = {
  async list(filtros = {}) {
    await delay(200, 450);
    const usuario = currentUser();
    let lista = propias(usuario._id)
      .filter((n) => !filtros.solo_no_leidas || !n.leida)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    if (filtros.limite) lista = lista.slice(0, filtros.limite);
    return clone(lista);
  },

  async contarNoLeidas() {
    await delay(100, 250);
    const usuario = currentUser();
    return { total: propias(usuario._id).filter((n) => !n.leida).length };
  },

  async marcarLeida(id) {
    await delay(100, 250);
    const usuario = currentUser();
    const notificacion = db.notificaciones.find((n) => n._id === id && n.usuario_id === usuario._id);
    if (!notificacion) fail(404, "La notificación no existe.");
    notificacion.leida = true;
    persist();
    return clone(notificacion);
  },

  async marcarTodasLeidas() {
    await delay(200, 400);
    const usuario = currentUser();
    const pendientes = propias(usuario._id).filter((n) => !n.leida);
    pendientes.forEach((n) => (n.leida = true));
    persist();
    return { actualizadas: pendientes.length };
  },

  /** Simula el WebSocket: solo entrega las notificaciones del usuario de la sesión. */
  conectar({ onNotificacion, onEstado }) {
    let usuarioId: string | null = null;
    try {
      usuarioId = currentUser()._id;
    } catch {
      onEstado("desconectado");
      return () => undefined;
    }
    onEstado("conectando");
    const timer = setTimeout(() => onEstado("conectado"), 300);
    const cancelar = subscribeMockNotifications((n) => {
      if (n.usuario_id === usuarioId) onNotificacion(n);
    });
    const cancelarSimulacion = programarActividadSimulada(usuarioId);
    return () => {
      clearTimeout(timer);
      cancelar();
      cancelarSimulacion();
    };
  },
};

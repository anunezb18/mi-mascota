import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import { tokenStorage } from "@/lib/token-storage";
import { notificacionesMock } from "@/mocks/services/notificaciones.mock";
import type { FiltrosNotificaciones, MensajeWebSocket, Notificacion } from "@/types";

export type EstadoConexion = "conectando" | "conectado" | "desconectado";

export interface ConexionCallbacks {
  onNotificacion(notificacion: Notificacion): void;
  onEstado(estado: EstadoConexion): void;
}

export interface NotificacionesService {
  /** Historial del usuario autenticado, de la más reciente a la más antigua. */
  list(filtros?: FiltrosNotificaciones): Promise<Notificacion[]>;
  contarNoLeidas(): Promise<{ total: number }>;
  marcarLeida(id: string): Promise<Notificacion>;
  marcarTodasLeidas(): Promise<{ actualizadas: number }>;
  /** Abre el canal en tiempo real. Devuelve la función que lo cierra. */
  conectar(callbacks: ConexionCallbacks): () => void;
}

/**
 * WebSocket del backend: `VITE_WS_URL?token=<JWT>`. El servidor reenvía cada
 * inserción en la colección `notificaciones` (change stream) del usuario del token.
 * Se reconecta con espera exponencial (1 s, 2 s, 4 s... hasta 30 s).
 */
function conectarWebSocket({ onNotificacion, onEstado }: ConexionCallbacks) {
  let socket: WebSocket | null = null;
  let intentos = 0;
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  let cerrado = false;

  const abrir = () => {
    const token = tokenStorage.get();
    if (!token || cerrado) return;
    onEstado("conectando");
    socket = new WebSocket(`${env.wsUrl}?token=${encodeURIComponent(token)}`);
    socket.onopen = () => {
      intentos = 0;
      onEstado("conectado");
    };
    socket.onmessage = (evento) => {
      try {
        const mensaje = JSON.parse(evento.data as string) as MensajeWebSocket;
        if (mensaje.evento === "notificacion") onNotificacion(mensaje.datos);
      } catch {
        /* mensaje con formato desconocido: se ignora */
      }
    };
    socket.onclose = (evento) => {
      socket = null;
      onEstado("desconectado");
      // 4401: token inválido. No se reintenta; el cliente HTTP gestiona la sesión.
      if (cerrado || evento.code === 4401) return;
      const espera = Math.min(30_000, 1000 * 2 ** intentos++);
      temporizador = setTimeout(abrir, espera);
    };
  };

  abrir();
  return () => {
    cerrado = true;
    clearTimeout(temporizador);
    socket?.close(1000);
  };
}

const notificacionesApi: NotificacionesService = {
  async list(filtros) {
    const { data } = await apiClient.get<Notificacion[]>("/notificaciones", { params: filtros });
    return data;
  },
  async contarNoLeidas() {
    const { data } = await apiClient.get<{ total: number }>("/notificaciones/no-leidas/total");
    return data;
  },
  async marcarLeida(id) {
    const { data } = await apiClient.patch<Notificacion>(`/notificaciones/${id}/leida`);
    return data;
  },
  async marcarTodasLeidas() {
    const { data } = await apiClient.patch<{ actualizadas: number }>("/notificaciones/leer-todas");
    return data;
  },
  conectar: conectarWebSocket,
};

export const notificacionesService: NotificacionesService = env.useMock ? notificacionesMock : notificacionesApi;

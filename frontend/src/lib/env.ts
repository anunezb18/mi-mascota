/** Configuración leída de las variables de entorno de Vite. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  wsUrl: import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws/notificaciones",
  useMock: import.meta.env.VITE_USE_MOCK === "true",
} as const;

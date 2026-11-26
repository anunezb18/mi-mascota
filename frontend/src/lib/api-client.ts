import axios, { AxiosError } from "axios";

import type { ApiErrorBody } from "@/types";

import { env } from "./env";
import { tokenStorage } from "./token-storage";

/** Error normalizado que exponen los servicios a la interfaz. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Evento global que se emite cuando la sesión deja de ser válida (401). */
export const SESSION_EXPIRED_EVENT = "mimascota:session-expired";

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
  // Arreglos como claves repetidas (?temperamento=a&temperamento=b), formato que espera FastAPI
  paramsSerializer: { indexes: null },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0;

    // El login devuelve 401 por credenciales inválidas: no se trata como sesión vencida
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (status === 401 && !isLoginRequest) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(new ApiError(extractMessage(error), status));
  },
);

function extractMessage(error: AxiosError<ApiErrorBody>): string {
  if (!error.response) {
    return "No fue posible conectar con el servidor. Verifique su conexión e intente de nuevo.";
  }
  const detail = error.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return `Datos inválidos: ${detail.map((d) => d.msg).join("; ")}`;
  }
  return DEFAULT_MESSAGES[error.response.status] ?? "Ocurrió un error inesperado. Intente de nuevo.";
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "La solicitud no es válida.",
  401: "Su sesión expiró. Inicie sesión nuevamente.",
  403: "No tiene permisos para realizar esta acción.",
  404: "El recurso solicitado no existe.",
  409: "El registro entra en conflicto con información existente.",
  422: "Algunos datos no son válidos. Revise el formulario.",
  500: "Error interno del servidor. Intente más tarde.",
  503: "El servicio no está disponible en este momento.",
};

/** Mensaje legible a partir de cualquier error lanzado por un servicio. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import { solicitudesMock } from "@/mocks/services/solicitudes.mock";
import type { CrearSolicitudPayload, Solicitud } from "@/types";

export interface SolicitudesService {
  /** Adoptante: envía una solicitud de adopción. */
  create(payload: CrearSolicitudPayload): Promise<Solicitud>;
  /** Adoptante: sus solicitudes, más recientes primero. */
  listMine(): Promise<Solicitud[]>;
}

const solicitudesApi: SolicitudesService = {
  async create(payload) {
    const { data } = await apiClient.post<Solicitud>("/solicitudes", payload);
    return data;
  },
  async listMine() {
    const { data } = await apiClient.get<Solicitud[]>("/solicitudes/mias");
    return data;
  },
};

export const solicitudesService: SolicitudesService = env.useMock ? solicitudesMock : solicitudesApi;

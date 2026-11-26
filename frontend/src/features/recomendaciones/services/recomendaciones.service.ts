import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import { recomendacionesMock } from "@/mocks/services/recomendaciones.mock";
import type { Recomendacion } from "@/types";

export interface RecomendacionesService {
  /** Mascotas compatibles con el perfil del adoptante autenticado, de mayor a menor compatibilidad. */
  list(params?: { limite?: number }): Promise<Recomendacion[]>;
}

const recomendacionesApi: RecomendacionesService = {
  async list(params) {
    const { data } = await apiClient.get<Recomendacion[]>("/recomendaciones", { params });
    return data;
  },
};

export const recomendacionesService: RecomendacionesService = env.useMock ? recomendacionesMock : recomendacionesApi;

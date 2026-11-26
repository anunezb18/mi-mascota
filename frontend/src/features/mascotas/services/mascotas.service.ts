import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import { mascotasMock } from "@/mocks/services/mascotas.mock";
import type { FiltrosMascotas, Mascota } from "@/types";

export interface MascotasService {
  /** Catálogo público. Con lat/lng ordena por cercanía e incluye `distancia_km`. */
  list(filtros: FiltrosMascotas): Promise<Mascota[]>;
  getById(id: string): Promise<Mascota>;
}

const mascotasApi: MascotasService = {
  async list(filtros) {
    const { data } = await apiClient.get<Mascota[]>("/mascotas", { params: filtros });
    return data;
  },
  async getById(id) {
    const { data } = await apiClient.get<Mascota>(`/mascotas/${id}`);
    return data;
  },
};

export const mascotasService: MascotasService = env.useMock ? mascotasMock : mascotasApi;

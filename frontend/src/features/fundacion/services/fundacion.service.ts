import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import { fundacionMock } from "@/mocks/services/fundacion.mock";
import type {
  FiltrosMascotas,
  Fundacion,
  IndicadoresFundacion,
  Mascota,
  MascotaPayload,
  RegistroMedicoPayload,
  ResolverSolicitudPayload,
  Solicitud,
} from "@/types";

export interface FundacionService {
  /** Fundación asociada a la cuenta autenticada (incluye su estado de validación). */
  getMiFundacion(): Promise<Fundacion>;
  getIndicadores(): Promise<IndicadoresFundacion>;
  /** Mascotas propias en cualquier estado, con búsqueda por nombre o raza. */
  listMascotas(filtros: FiltrosMascotas): Promise<Mascota[]>;
  crearMascota(payload: MascotaPayload): Promise<Mascota>;
  actualizarMascota(id: string, payload: Partial<MascotaPayload>): Promise<Mascota>;
  /** Agrega un registro al arreglo embebido `historial_medico` ($push). */
  agregarRegistroMedico(id: string, registro: RegistroMedicoPayload): Promise<Mascota>;
  /** Sube una foto y devuelve la URL pública que se guarda en `fotos`. */
  subirFoto(archivo: File): Promise<{ url: string }>;
  /** Solicitudes recibidas por la fundación. */
  listSolicitudes(): Promise<Solicitud[]>;
  /**
   * Aprueba o rechaza una solicitud. Al aprobar, el backend (en una transacción)
   * marca la mascota como adoptada y rechaza las demás solicitudes pendientes.
   */
  resolverSolicitud(id: string, payload: ResolverSolicitudPayload): Promise<Solicitud>;
}

const fundacionApi: FundacionService = {
  async getMiFundacion() {
    const { data } = await apiClient.get<Fundacion>("/fundaciones/me");
    return data;
  },
  async getIndicadores() {
    const { data } = await apiClient.get<IndicadoresFundacion>("/fundaciones/me/indicadores");
    return data;
  },
  async listMascotas(filtros) {
    const { data } = await apiClient.get<Mascota[]>("/fundaciones/me/mascotas", { params: filtros });
    return data;
  },
  async crearMascota(payload) {
    const { data } = await apiClient.post<Mascota>("/mascotas", payload);
    return data;
  },
  async actualizarMascota(id, payload) {
    const { data } = await apiClient.patch<Mascota>(`/mascotas/${id}`, payload);
    return data;
  },
  async agregarRegistroMedico(id, registro) {
    const { data } = await apiClient.post<Mascota>(`/mascotas/${id}/historial-medico`, registro);
    return data;
  },
  async subirFoto(archivo) {
    const body = new FormData();
    body.append("archivo", archivo);
    const { data } = await apiClient.post<{ url: string }>("/mascotas/fotos", body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  async listSolicitudes() {
    const { data } = await apiClient.get<Solicitud[]>("/fundaciones/me/solicitudes");
    return data;
  },
  async resolverSolicitud(id, payload) {
    const { data } = await apiClient.patch<Solicitud>(`/solicitudes/${id}/resolver`, payload);
    return data;
  },
};

export const fundacionService: FundacionService = env.useMock ? fundacionMock : fundacionApi;

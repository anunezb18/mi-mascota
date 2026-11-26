import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import { adminMock } from "@/mocks/services/admin.mock";
import type {
  CambiarEstadoUsuarioPayload,
  FiltrosFundaciones,
  FiltrosUsuarios,
  FundacionAdmin,
  Usuario,
  ValidarFundacionPayload,
} from "@/types";

export interface AdminService {
  /** Fundaciones registradas con los datos de su representante. */
  listFundaciones(filtros?: FiltrosFundaciones): Promise<FundacionAdmin[]>;
  /**
   * Aprueba o rechaza una fundación pendiente. El backend registra la fecha de
   * validación y notifica a la cuenta de la fundación. Solo aplica a pendientes (409 si no).
   */
  validarFundacion(id: string, payload: ValidarFundacionPayload): Promise<FundacionAdmin>;
  listUsuarios(filtros?: FiltrosUsuarios): Promise<Usuario[]>;
  /** Borrado lógico: cambia `activo` sin eliminar el documento. */
  cambiarEstadoUsuario(id: string, payload: CambiarEstadoUsuarioPayload): Promise<Usuario>;
}

const adminApi: AdminService = {
  async listFundaciones(filtros) {
    const { data } = await apiClient.get<FundacionAdmin[]>("/admin/fundaciones", { params: filtros });
    return data;
  },
  async validarFundacion(id, payload) {
    const { data } = await apiClient.patch<FundacionAdmin>(`/admin/fundaciones/${id}/validacion`, payload);
    return data;
  },
  async listUsuarios(filtros) {
    const { data } = await apiClient.get<Usuario[]>("/admin/usuarios", { params: filtros });
    return data;
  },
  async cambiarEstadoUsuario(id, payload) {
    const { data } = await apiClient.patch<Usuario>(`/admin/usuarios/${id}/estado`, payload);
    return data;
  },
};

export const adminService: AdminService = env.useMock ? adminMock : adminApi;

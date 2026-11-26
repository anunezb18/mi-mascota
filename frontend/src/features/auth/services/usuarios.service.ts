import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import { usuariosMock } from "@/mocks/services/usuarios.mock";
import type { ActualizarCuentaPayload, CambiarContrasenaPayload, PerfilEstiloVida, Usuario } from "@/types";

export type PerfilEstiloVidaPayload = Omit<PerfilEstiloVida, "actualizado_en">;

export interface UsuariosService {
  /** Adoptante: crea o reemplaza su perfil de estilo de vida (subdocumento embebido). */
  guardarPerfilEstiloVida(perfil: PerfilEstiloVidaPayload): Promise<Usuario>;
  /** Datos personales de la cuenta autenticada. El correo no se puede cambiar. */
  actualizarCuenta(payload: ActualizarCuentaPayload): Promise<Usuario>;
  /** Verifica la contraseña actual antes de reemplazarla (400 si no coincide). */
  cambiarContrasena(payload: CambiarContrasenaPayload): Promise<void>;
}

const usuariosApi: UsuariosService = {
  async guardarPerfilEstiloVida(perfil) {
    const { data } = await apiClient.put<Usuario>("/usuarios/me/perfil-estilo-vida", perfil);
    return data;
  },
  async actualizarCuenta(payload) {
    const { data } = await apiClient.patch<Usuario>("/usuarios/me", payload);
    return data;
  },
  async cambiarContrasena(payload) {
    await apiClient.put("/usuarios/me/contrasena", payload);
  },
};

export const usuariosService: UsuariosService = env.useMock ? usuariosMock : usuariosApi;

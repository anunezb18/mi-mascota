import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ActualizarCuentaPayload, CambiarContrasenaPayload } from "@/types";

import { ME_QUERY_KEY } from "./auth-context";
import { usuariosService } from "./services/usuarios.service";

export function useActualizarCuenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ActualizarCuentaPayload) => usuariosService.actualizarCuenta(payload),
    onSuccess: (usuario) => queryClient.setQueryData(ME_QUERY_KEY, usuario),
  });
}

export function useCambiarContrasena() {
  return useMutation({
    mutationFn: (payload: CambiarContrasenaPayload) => usuariosService.cambiarContrasena(payload),
  });
}

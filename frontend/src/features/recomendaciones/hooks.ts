import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ME_QUERY_KEY, useAuth } from "@/features/auth/auth-context";
import { type PerfilEstiloVidaPayload, usuariosService } from "@/features/auth/services/usuarios.service";
import { queryKeys } from "@/lib/query-keys";

import { recomendacionesService } from "./services/recomendaciones.service";

export function useRecomendaciones() {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: queryKeys.recomendaciones.all,
    queryFn: () => recomendacionesService.list({ limite: 12 }),
    enabled: Boolean(usuario?.perfil_estilo_vida),
  });
}

export function useGuardarPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (perfil: PerfilEstiloVidaPayload) => usuariosService.guardarPerfilEstiloVida(perfil),
    onSuccess: (usuario) => {
      queryClient.setQueryData(ME_QUERY_KEY, usuario);
      // Las recomendaciones dependen del perfil: se recalculan
      queryClient.invalidateQueries({ queryKey: queryKeys.recomendaciones.all });
    },
  });
}

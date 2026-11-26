import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/auth-context";
import { queryKeys } from "@/lib/query-keys";
import type { CrearSolicitudPayload } from "@/types";

import { solicitudesService } from "./services/solicitudes.service";

/** Solicitudes del adoptante autenticado. Solo se consulta con rol adoptante. */
export function useMisSolicitudes() {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: queryKeys.solicitudes.mias,
    queryFn: solicitudesService.listMine,
    enabled: usuario?.rol === "adoptante",
  });
}

export function useCrearSolicitud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearSolicitudPayload) => solicitudesService.create(payload),
    onSuccess: (_solicitud, { mascota_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.solicitudes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.mascotas.detail(mascota_id) });
    },
  });
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { FiltrosUsuarios, Usuario, ValidarFundacionPayload } from "@/types";

import { adminService } from "./services/admin.service";

/** Todas las fundaciones; el filtro por estado y la búsqueda se aplican en la pantalla. */
export function useFundacionesAdmin() {
  return useQuery({
    queryKey: queryKeys.admin.fundaciones({}),
    queryFn: () => adminService.listFundaciones(),
  });
}

export function useValidarFundacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ValidarFundacionPayload }) =>
      adminService.validarFundacion(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      // Una fundación aprobada aparece en el catálogo con sus mascotas
      queryClient.invalidateQueries({ queryKey: queryKeys.mascotas.all });
    },
  });
}

export function useUsuariosAdmin(filtros: FiltrosUsuarios) {
  return useQuery({
    queryKey: queryKeys.admin.usuarios(filtros),
    queryFn: () => adminService.listUsuarios(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => adminService.cambiarEstadoUsuario(id, { activo }),
    onSuccess: (actualizado) => {
      // Refleja el cambio de inmediato en todas las listas en caché
      queryClient.setQueriesData<Usuario[]>({ queryKey: ["admin", "usuarios"] }, (lista) =>
        lista?.map((u) => (u._id === actualizado._id ? actualizado : u)),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

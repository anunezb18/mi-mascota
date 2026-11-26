import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { FiltrosMascotas } from "@/types";

import { mascotasService } from "./services/mascotas.service";

export function useMascotas(filtros: FiltrosMascotas) {
  return useQuery({
    queryKey: queryKeys.mascotas.list(filtros),
    queryFn: () => mascotasService.list(filtros),
    // Mantiene los resultados anteriores mientras se aplican filtros nuevos
    placeholderData: keepPreviousData,
  });
}

export function useMascota(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mascotas.detail(id ?? ""),
    queryFn: () => mascotasService.getById(id!),
    enabled: Boolean(id),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/auth-context";
import { queryKeys } from "@/lib/query-keys";
import type { FiltrosNotificaciones, Notificacion } from "@/types";

import { notificacionesService } from "./services/notificaciones.service";

export function useNotificaciones(filtros: FiltrosNotificaciones = {}, { enabled = true } = {}) {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: queryKeys.notificaciones.list(filtros),
    queryFn: () => notificacionesService.list(filtros),
    enabled: Boolean(usuario) && enabled,
  });
}

export function useNoLeidas() {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: queryKeys.notificaciones.noLeidas,
    queryFn: notificacionesService.contarNoLeidas,
    enabled: Boolean(usuario),
    select: (data) => data.total,
    staleTime: 60_000,
  });
}

/** Aplica un cambio a todas las listas de notificaciones en caché. */
function actualizarListas(
  queryClient: ReturnType<typeof useQueryClient>,
  cambio: (lista: Notificacion[], filtros: FiltrosNotificaciones) => Notificacion[],
) {
  queryClient
    .getQueriesData<Notificacion[]>({ queryKey: ["notificaciones", "lista"] })
    .forEach(([key, lista]) => {
      if (!lista) return;
      const filtros = (key[2] ?? {}) as FiltrosNotificaciones;
      queryClient.setQueryData(key, cambio(lista, filtros));
    });
}

/** Inserta una notificación recibida en tiempo real sin volver a consultar la API. */
export function useInsertarNotificacion() {
  const queryClient = useQueryClient();
  return (nueva: Notificacion) => {
    actualizarListas(queryClient, (lista, filtros) => {
      if (lista.some((n) => n._id === nueva._id)) return lista;
      const siguiente = [nueva, ...lista];
      return filtros.limite ? siguiente.slice(0, filtros.limite) : siguiente;
    });
    queryClient.setQueryData<{ total: number }>(queryKeys.notificaciones.noLeidas, (prev) =>
      prev ? { total: prev.total + (nueva.leida ? 0 : 1) } : prev,
    );
  };
}

export function useMarcarLeida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificacionesService.marcarLeida(id),
    // Actualización optimista: la marca desaparece al instante
    onMutate: (id) => {
      let eraNoLeida = false;
      actualizarListas(queryClient, (lista, filtros) =>
        lista
          .map((n) => {
            if (n._id !== id) return n;
            if (!n.leida) eraNoLeida = true;
            return { ...n, leida: true };
          })
          .filter((n) => !filtros.solo_no_leidas || !n.leida || n._id !== id),
      );
      if (eraNoLeida) {
        queryClient.setQueryData<{ total: number }>(queryKeys.notificaciones.noLeidas, (prev) =>
          prev ? { total: Math.max(0, prev.total - 1) } : prev,
        );
      }
    },
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.notificaciones.all }),
  });
}

export function useMarcarTodasLeidas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificacionesService.marcarTodasLeidas,
    onMutate: () => {
      actualizarListas(queryClient, (lista, filtros) =>
        filtros.solo_no_leidas ? [] : lista.map((n) => ({ ...n, leida: true })),
      );
      queryClient.setQueryData(queryKeys.notificaciones.noLeidas, { total: 0 });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.notificaciones.all }),
  });
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/auth-context";
import { queryKeys } from "@/lib/query-keys";
import type {
  FiltrosMascotas,
  Mascota,
  MascotaPayload,
  RegistroMedicoPayload,
  ResolverSolicitudPayload,
} from "@/types";

import { fundacionService } from "./services/fundacion.service";

function useEsFundacion() {
  const { usuario } = useAuth();
  return usuario?.rol === "fundacion";
}

export function useMiFundacion() {
  return useQuery({
    queryKey: queryKeys.fundacion.me,
    queryFn: fundacionService.getMiFundacion,
    enabled: useEsFundacion(),
    staleTime: 5 * 60_000,
  });
}

export function useIndicadores() {
  return useQuery({ queryKey: queryKeys.fundacion.indicadores, queryFn: fundacionService.getIndicadores });
}

export function useMascotasFundacion(filtros: FiltrosMascotas) {
  return useQuery({
    queryKey: queryKeys.fundacion.mascotas(filtros),
    queryFn: () => fundacionService.listMascotas(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useSolicitudesFundacion() {
  return useQuery({
    queryKey: queryKeys.fundacion.solicitudes,
    queryFn: fundacionService.listSolicitudes,
    enabled: useEsFundacion(),
  });
}

/** Tras cualquier cambio en mascotas o solicitudes se refrescan catálogo, panel e indicadores. */
function useInvalidarFundacion() {
  const queryClient = useQueryClient();
  return (mascota?: Mascota) => {
    if (mascota) queryClient.setQueryData(queryKeys.mascotas.detail(mascota._id), mascota);
    queryClient.invalidateQueries({ queryKey: queryKeys.fundacion.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.mascotas.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.recomendaciones.all });
  };
}

export function useCrearMascota() {
  const invalidar = useInvalidarFundacion();
  return useMutation({
    mutationFn: (payload: MascotaPayload) => fundacionService.crearMascota(payload),
    onSuccess: (mascota) => invalidar(mascota),
  });
}

export function useActualizarMascota() {
  const invalidar = useInvalidarFundacion();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MascotaPayload> }) =>
      fundacionService.actualizarMascota(id, payload),
    onSuccess: (mascota) => invalidar(mascota),
  });
}

export function useAgregarRegistroMedico() {
  const invalidar = useInvalidarFundacion();
  return useMutation({
    mutationFn: ({ id, registro }: { id: string; registro: RegistroMedicoPayload }) =>
      fundacionService.agregarRegistroMedico(id, registro),
    onSuccess: (mascota) => invalidar(mascota),
  });
}

export function useSubirFoto() {
  return useMutation({ mutationFn: (archivo: File) => fundacionService.subirFoto(archivo) });
}

export function useResolverSolicitud() {
  const invalidar = useInvalidarFundacion();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResolverSolicitudPayload }) =>
      fundacionService.resolverSolicitud(id, payload),
    onSuccess: () => {
      invalidar();
      queryClient.invalidateQueries({ queryKey: queryKeys.solicitudes.all });
    },
  });
}

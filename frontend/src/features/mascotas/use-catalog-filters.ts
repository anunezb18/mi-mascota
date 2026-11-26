import * as React from "react";
import { useSearchParams } from "react-router-dom";

import { LOCALIDADES_BOGOTA } from "@/lib/bogota";
import { ESPECIE_LABEL, ETAPA_LABEL, TAMANO_LABEL, TEMPERAMENTO_LABEL } from "@/lib/labels";
import type { Especie, EtapaVida, FiltrosMascotas, Tamano, Temperamento } from "@/types";

export type Vista = "lista" | "mapa";

export interface Origen {
  tipo: "dispositivo" | "localidad";
  etiqueta: string;
  lat: number;
  lng: number;
}

const RADIO_DEFAULT = 10;

const isKey = <T extends string>(record: Record<T, string>, value: string | null): value is T =>
  value !== null && value in record;

/**
 * Estado de los filtros del catálogo guardado en la URL, para que la búsqueda
 * se pueda compartir, recargar y navegar con los botones del navegador.
 */
export function useCatalogFilters() {
  const [params, setParams] = useSearchParams();

  const state = React.useMemo(() => {
    const especie = params.get("especie");
    const tamano = params.get("tamano");
    const etapa = params.get("etapa");
    const temperamento = (params.get("temperamento") ?? "")
      .split(",")
      .filter((t): t is Temperamento => isKey(TEMPERAMENTO_LABEL, t));
    const radio = Math.min(50, Math.max(1, Number(params.get("radio")) || RADIO_DEFAULT));

    let origen: Origen | null = null;
    const localidad = LOCALIDADES_BOGOTA.find((l) => l.id === params.get("localidad"));
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    if (localidad) {
      origen = { tipo: "localidad", etiqueta: localidad.nombre, lat: localidad.lat, lng: localidad.lng };
    } else if (params.has("lat") && params.has("lng") && Number.isFinite(lat) && Number.isFinite(lng)) {
      origen = { tipo: "dispositivo", etiqueta: "Mi ubicación", lat, lng };
    }

    return {
      especie: isKey(ESPECIE_LABEL, especie) ? (especie as Especie) : undefined,
      tamano: isKey(TAMANO_LABEL, tamano) ? (tamano as Tamano) : undefined,
      etapa: isKey(ETAPA_LABEL, etapa) ? (etapa as EtapaVida) : undefined,
      temperamento,
      origen,
      radio,
      vista: (params.get("vista") === "mapa" ? "mapa" : "lista") as Vista,
    };
  }, [params]);

  const update = React.useCallback(
    (changes: Record<string, string | null | undefined>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === undefined || value === "") next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setOrigenLocalidad = (id: string | null) => update({ localidad: id, lat: null, lng: null });
  const setOrigenDispositivo = (lat: number, lng: number) =>
    update({ localidad: null, lat: String(lat), lng: String(lng) });

  const clear = () => setParams(state.vista === "mapa" ? { vista: "mapa" } : {}, { replace: true });

  const filtros: FiltrosMascotas = React.useMemo(
    () => ({
      especie: state.especie,
      tamano: state.tamano,
      etapa: state.etapa,
      temperamento: state.temperamento.length ? state.temperamento : undefined,
      ...(state.origen ? { lat: state.origen.lat, lng: state.origen.lng, radio_km: state.radio } : {}),
    }),
    [state],
  );

  const activeCount =
    Number(Boolean(state.especie)) +
    Number(Boolean(state.tamano)) +
    Number(Boolean(state.etapa)) +
    state.temperamento.length +
    Number(Boolean(state.origen));

  return { ...state, filtros, activeCount, update, setOrigenLocalidad, setOrigenDispositivo, clear };
}

export type CatalogFilters = ReturnType<typeof useCatalogFilters>;

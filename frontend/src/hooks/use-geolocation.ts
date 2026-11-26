import * as React from "react";

type Estado = "idle" | "loading" | "success" | "error";

interface GeolocationState {
  status: Estado;
  coords: { lat: number; lng: number } | null;
  error: string | null;
}

/** Solicita la ubicación del navegador bajo demanda (nunca al cargar la página). */
export function useGeolocation() {
  const [state, setState] = React.useState<GeolocationState>({ status: "idle", coords: null, error: null });

  const request = React.useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ status: "error", coords: null, error: "Su navegador no permite obtener la ubicación." });
      return;
    }
    setState((s) => ({ ...s, status: "loading", error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: "success",
          coords: { lat: Number(pos.coords.latitude.toFixed(5)), lng: Number(pos.coords.longitude.toFixed(5)) },
          error: null,
        }),
      (err) =>
        setState({
          status: "error",
          coords: null,
          error:
            err.code === err.PERMISSION_DENIED
              ? "No autorizó el acceso a su ubicación. Puede elegir una localidad de referencia."
              : "No fue posible obtener su ubicación. Intente de nuevo o elija una localidad.",
        }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, []);

  return { ...state, request };
}

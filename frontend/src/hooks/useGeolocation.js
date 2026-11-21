import { useState } from "react";

// Obtiene la ubicación del navegador para la búsqueda por cercanía.
export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  function locate() {
    if (!navigator.geolocation) {
      setError("El navegador no soporta geolocalización");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      (err) => setError(err.message)
    );
  }

  return { position, error, locate };
}

import * as React from "react";

/** Actualiza el título de la pestaña: "Sección · MiMascota". */
export function useDocumentTitle(title?: string) {
  React.useEffect(() => {
    document.title = title ? `${title} · MiMascota` : "MiMascota · Adopción de mascotas en Bogotá";
  }, [title]);
}

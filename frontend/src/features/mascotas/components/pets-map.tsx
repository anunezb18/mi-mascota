import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { ArrowRight, MapPin } from "lucide-react";
import * as React from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Link } from "react-router-dom";

import { BOGOTA_CENTER } from "@/lib/bogota";
import { formatAge, formatDistance } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Mascota } from "@/types";

export interface PetsMapProps {
  mascotas: Mascota[];
  /** Punto desde el que se busca, en grados. */
  origen?: { lat: number; lng: number; etiqueta: string } | null;
  radioKm?: number;
  /** Muestra la ventana emergente con el resumen de cada mascota. */
  popups?: boolean;
  className?: string;
  zoom?: number;
}

/** Marcador con la foto de la mascota. Se construye con nodos DOM para no interpolar HTML. */
function petIcon(mascota: Mascota) {
  const el = document.createElement("div");
  el.className = "pet-marker";
  if (mascota.fotos[0]) {
    const img = document.createElement("img");
    img.src = mascota.fotos[0];
    img.alt = "";
    img.onerror = () => img.remove();
    el.appendChild(img);
  }
  return L.divIcon({ html: el, className: "", iconSize: [48, 58], iconAnchor: [24, 58], popupAnchor: [0, -54] });
}

const originIcon = L.divIcon({
  html: '<span class="origin-marker"></span>',
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function FitToMarkers({ mascotas, origen }: Pick<PetsMapProps, "mascotas" | "origen">) {
  const map = useMap();
  React.useEffect(() => {
    const points: L.LatLngExpression[] = mascotas.map((m) => [m.ubicacion.coordinates[1], m.ubicacion.coordinates[0]]);
    if (origen) points.push([origen.lat, origen.lng]);
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], Math.max(map.getZoom(), 14));
    else map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 });
  }, [map, mascotas, origen]);
  return null;
}

export default function PetsMap({ mascotas, origen, radioKm, popups = true, className, zoom = 12 }: PetsMapProps) {
  // Los íconos se crean una vez por resultado para no recrear los marcadores en cada render
  const icons = React.useMemo(() => new Map(mascotas.map((m) => [m._id, petIcon(m)])), [mascotas]);

  return (
    <div className={cn("relative isolate overflow-hidden rounded-2xl border shadow-card", className)}>
      <MapContainer
        center={origen ? [origen.lat, origen.lng] : BOGOTA_CENTER}
        zoom={zoom}
        scrollWheelZoom={false}
        className="size-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToMarkers mascotas={mascotas} origen={origen} />

        {origen && (
          <>
            <Marker position={[origen.lat, origen.lng]} icon={originIcon} title={origen.etiqueta} />
            {radioKm && (
              <Circle
                center={[origen.lat, origen.lng]}
                radius={radioKm * 1000}
                pathOptions={{ color: "#28655B", weight: 1.5, fillColor: "#357E71", fillOpacity: 0.07, dashArray: "6 6" }}
              />
            )}
          </>
        )}

        {mascotas.map((m) => (
          <Marker
            key={m._id}
            position={[m.ubicacion.coordinates[1], m.ubicacion.coordinates[0]]}
            icon={icons.get(m._id)!}
            title={m.nombre}
            alt={`Ubicación de ${m.nombre}`}
          >
            {popups && (
              <Popup>
                <div className="flex w-56 gap-3">
                  <img
                    src={m.fotos[0]}
                    alt=""
                    className="size-16 shrink-0 rounded-lg bg-arena-200 object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold leading-tight">{m.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.raza}</p>
                    <p className="mt-1 text-xs font-semibold">
                      {formatAge(m.edad_meses)}
                      {m.distancia_km !== undefined && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 text-primary">
                          <MapPin className="size-3" aria-hidden="true" />
                          {formatDistance(m.distancia_km)}
                        </span>
                      )}
                    </p>
                    <Link
                      to={paths.mascota(m._id)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold !text-primary hover:underline"
                    >
                      Ver perfil
                      <ArrowRight className="size-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

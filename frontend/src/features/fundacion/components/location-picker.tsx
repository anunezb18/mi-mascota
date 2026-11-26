import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { Building2, MapPin } from "lucide-react";
import * as React from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { BOGOTA_CENTER } from "@/lib/bogota";

interface Punto {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: Punto | null;
  onChange: (punto: Punto) => void;
  /** Coordenadas de la sede [lng, lat] para el atajo «Usar la sede». */
  sede?: [number, number];
}

const pinIcon = L.divIcon({
  html: '<span class="origin-marker" style="background:#B9461D;box-shadow:0 0 0 6px rgb(185 70 29 / .25)"></span>',
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const redondear = (n: number) => Number(n.toFixed(5));

function ClickHandler({ onPick }: { onPick: (p: Punto) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: redondear(e.latlng.lat), lng: redondear(e.latlng.lng) }),
  });
  return null;
}

function Recenter({ value }: { value: Punto | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 14));
  }, [map, value]);
  return null;
}

/** Selección de la ubicación (sede u hogar de paso) haciendo clic o arrastrando el marcador. */
export default function LocationPicker({ value, onChange, sede }: LocationPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative isolate h-72 overflow-hidden rounded-xl border">
        <MapContainer
          center={value ? [value.lat, value.lng] : BOGOTA_CENTER}
          zoom={value ? 14 : 11}
          scrollWheelZoom={false}
          className="size-full cursor-crosshair"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          <Recenter value={value} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable
              title="Ubicación de la mascota"
              eventHandlers={{
                dragend: (e) => {
                  const p = (e.target as L.Marker).getLatLng();
                  onChange({ lat: redondear(p.lat), lng: redondear(p.lng) });
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="flex items-center gap-1.5 text-muted-foreground" aria-live="polite">
          <MapPin className="size-4" aria-hidden="true" />
          {value ? `Lat. ${value.lat}, long. ${value.lng}` : "Haga clic en el mapa para ubicar a la mascota."}
        </p>
        {sede && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({ lng: sede[0], lat: sede[1] })}>
            <Building2 aria-hidden="true" />
            Usar la sede de la fundación
          </Button>
        )}
      </div>
    </div>
  );
}

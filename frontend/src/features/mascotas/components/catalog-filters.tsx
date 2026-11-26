import { Loader2, LocateFixed, X } from "lucide-react";
import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ChipToggle, ChipToggleGroup } from "@/components/ui/toggle-group";
import { useGeolocation } from "@/hooks/use-geolocation";
import { LOCALIDADES_BOGOTA } from "@/lib/bogota";
import { ESPECIE_PLURAL, ETAPA_LABEL, TAMANO_LABEL, TEMPERAMENTO_LABEL } from "@/lib/labels";
import type { Especie, EtapaVida, Tamano, Temperamento } from "@/types";

import type { CatalogFilters as Filters } from "../use-catalog-filters";
import { ESPECIE_ICON } from "./pet-image";

/** Panel de filtros del catálogo. Se reutiliza en la barra lateral y en el panel móvil. */
export function CatalogFilters({ filters }: { filters: Filters }) {
  const { update } = filters;

  return (
    <div className="flex flex-col gap-7">
      <FilterGroup title="Especie">
        <ChipToggleGroup
          type="single"
          value={filters.especie ?? ""}
          onValueChange={(v) => update({ especie: v || null })}
          className="flex flex-wrap gap-2"
          aria-label="Especie"
        >
          {(Object.keys(ESPECIE_PLURAL) as Especie[]).map((e) => {
            const Icon = ESPECIE_ICON[e];
            return (
              <ChipToggle key={e} value={e}>
                <Icon aria-hidden="true" />
                {ESPECIE_PLURAL[e]}
              </ChipToggle>
            );
          })}
        </ChipToggleGroup>
      </FilterGroup>

      <FilterGroup title="Tamaño">
        <ChipToggleGroup
          type="single"
          value={filters.tamano ?? ""}
          onValueChange={(v) => update({ tamano: v || null })}
          className="flex flex-wrap gap-2"
          aria-label="Tamaño"
        >
          {(Object.keys(TAMANO_LABEL) as Tamano[]).map((t) => (
            <ChipToggle key={t} value={t}>
              {TAMANO_LABEL[t]}
            </ChipToggle>
          ))}
        </ChipToggleGroup>
      </FilterGroup>

      <FilterGroup title="Edad" htmlFor="filtro-etapa">
        <Select value={filters.etapa ?? "todas"} onValueChange={(v) => update({ etapa: v === "todas" ? null : v })}>
          <SelectTrigger id="filtro-etapa">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Cualquier edad</SelectItem>
            {(Object.keys(ETAPA_LABEL) as EtapaVida[]).map((e) => (
              <SelectItem key={e} value={e}>
                {ETAPA_LABEL[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup title="Temperamento" description="Muestra mascotas con todos los rasgos seleccionados.">
        <ChipToggleGroup
          type="multiple"
          value={filters.temperamento}
          onValueChange={(v: string[]) => update({ temperamento: v.join(",") || null })}
          className="flex flex-wrap gap-2"
          aria-label="Temperamento"
        >
          {(Object.keys(TEMPERAMENTO_LABEL) as Temperamento[]).map((t) => (
            <ChipToggle key={t} value={t}>
              {TEMPERAMENTO_LABEL[t]}
            </ChipToggle>
          ))}
        </ChipToggleGroup>
      </FilterGroup>

      <DistanceFilter filters={filters} />
    </div>
  );
}

function FilterGroup({
  title,
  description,
  htmlFor,
  children,
}: {
  title: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div role={htmlFor ? undefined : "group"} aria-labelledby={htmlFor ? undefined : id} className="flex flex-col gap-3">
      <div>
        {htmlFor ? (
          <Label htmlFor={htmlFor}>{title}</Label>
        ) : (
          <p id={id} className="text-sm font-semibold">
            {title}
          </p>
        )}
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function DistanceFilter({ filters }: { filters: Filters }) {
  const geo = useGeolocation();
  const { origen, radio, update, setOrigenDispositivo, setOrigenLocalidad } = filters;
  // Valor local mientras se arrastra; la consulta se hace al soltar el control
  const [radioLocal, setRadioLocal] = React.useState(radio);
  React.useEffect(() => setRadioLocal(radio), [radio]);

  const coords = geo.coords;
  React.useEffect(() => {
    if (coords) setOrigenDispositivo(coords.lat, coords.lng);
  }, [coords]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FilterGroup title="Cercanía" description="Busque mascotas dentro de un radio desde su ubicación o una localidad.">
      <Button
        type="button"
        variant={origen?.tipo === "dispositivo" ? "secondary" : "outline"}
        onClick={geo.request}
        disabled={geo.status === "loading"}
        className="justify-start"
      >
        {geo.status === "loading" ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <LocateFixed aria-hidden="true" />
        )}
        {origen?.tipo === "dispositivo" ? "Usando mi ubicación" : "Usar mi ubicación"}
      </Button>
      {geo.error && (
        <Alert variant="warning" className="p-3 text-xs">
          {geo.error}
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="filtro-localidad" className="text-xs font-semibold text-muted-foreground">
          O desde una localidad de Bogotá
        </Label>
        <Select
          value={origen?.tipo === "localidad" ? LOCALIDADES_BOGOTA.find((l) => l.nombre === origen.etiqueta)?.id : ""}
          onValueChange={(v) => setOrigenLocalidad(v)}
        >
          <SelectTrigger id="filtro-localidad">
            <SelectValue placeholder="Seleccione una localidad" />
          </SelectTrigger>
          <SelectContent>
            {LOCALIDADES_BOGOTA.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {origen && (
        <div className="flex flex-col gap-2 rounded-xl bg-muted/70 p-3">
          <div className="flex items-center justify-between text-sm">
            <span id="radio-label" className="font-semibold">
              Radio de búsqueda
            </span>
            <span className="font-bold text-primary" aria-live="polite">
              {radioLocal} km
            </span>
          </div>
          <Slider
            min={1}
            max={30}
            step={1}
            value={[radioLocal]}
            onValueChange={([v]) => setRadioLocal(v)}
            onValueCommit={([v]) => update({ radio: String(v) })}
            thumbLabel="Radio de búsqueda en kilómetros"
          />
          <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setOrigenLocalidad(null)}>
            <X aria-hidden="true" />
            Quitar búsqueda por cercanía
          </Button>
        </div>
      )}
    </FilterGroup>
  );
}

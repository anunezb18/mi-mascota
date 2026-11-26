import { List, Map as MapIcon, SearchX, SlidersHorizontal, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ESPECIE_PLURAL, ETAPA_LABEL, TAMANO_LABEL, TEMPERAMENTO_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

import { CatalogFilters } from "../components/catalog-filters";
import { PetCard, PetGridSkeleton } from "../components/pet-card";
import { useMascotas } from "../hooks";
import { type CatalogFilters as Filters, useCatalogFilters } from "../use-catalog-filters";

const PetsMap = React.lazy(() => import("../components/pets-map"));

export default function CatalogPage() {
  useDocumentTitle("Mascotas en adopción");
  const filters = useCatalogFilters();
  const query = useMascotas(filters.filtros);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const total = query.data?.length ?? 0;
  const resultsLabel = query.isPending
    ? "Buscando mascotas…"
    : query.isError
      ? "Sin resultados"
      : `${total} ${total === 1 ? "mascota encontrada" : "mascotas encontradas"}`;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Adopción"
        title="Mascotas en adopción"
        description="Filtre por especie, tamaño, edad y temperamento, o busque las mascotas más cercanas a usted."
      />

      <div className="grid gap-8 lg:grid-cols-[17.5rem_1fr]">
        {/* Filtros en escritorio */}
        <aside aria-label="Filtros" className="hidden lg:block">
          <div className="sticky top-[calc(var(--navbar-height)+1.5rem)] max-h-[calc(100dvh-var(--navbar-height)-3rem)] overflow-y-auto rounded-2xl border bg-card p-5 shadow-card">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Filtros</h2>
              {filters.activeCount > 0 && (
                <Button variant="link" size="sm" className="h-auto px-0" onClick={filters.clear}>
                  Limpiar
                </Button>
              )}
            </div>
            <CatalogFilters filters={filters} />
          </div>
        </aside>

        <section aria-label="Resultados" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button variant="outline" className="lg:hidden" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal aria-hidden="true" />
              Filtros
              {filters.activeCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-primary text-[0.6875rem] text-primary-foreground">
                  {filters.activeCount}
                </span>
              )}
            </Button>

            <div className="min-w-0 flex-1">
              <p className="font-semibold" aria-live="polite">
                {resultsLabel}
              </p>
              {filters.origen && (
                <p className="text-sm text-muted-foreground">
                  A menos de {filters.radio} km de {filters.origen.etiqueta.toLowerCase() === "mi ubicación" ? "su ubicación" : filters.origen.etiqueta}, ordenadas por cercanía.
                </p>
              )}
            </div>

            <ToggleGroup
              type="single"
              value={filters.vista}
              onValueChange={(v) => v && filters.update({ vista: v === "mapa" ? "mapa" : null })}
              aria-label="Tipo de vista"
            >
              <ToggleGroupItem value="lista" aria-label="Ver en lista">
                <List aria-hidden="true" />
                <span className="hidden sm:inline">Lista</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="mapa" aria-label="Ver en mapa">
                <MapIcon aria-hidden="true" />
                <span className="hidden sm:inline">Mapa</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <ActiveFilters filters={filters} />

          <div className={cn("transition-opacity duration-200", query.isPlaceholderData && "opacity-60")}>
            {query.isPending ? (
              filters.vista === "mapa" ? <MapSkeleton /> : <PetGridSkeleton count={6} />
            ) : query.isError ? (
              <ErrorState error={query.error} onRetry={() => query.refetch()} />
            ) : total === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No encontramos mascotas con estos filtros"
                description={
                  filters.origen
                    ? "Intente ampliar el radio de búsqueda o quitar algunos filtros. Las fundaciones publican mascotas nuevas cada semana."
                    : "Intente quitar algunos filtros. Las fundaciones publican mascotas nuevas cada semana."
                }
                action={
                  <Button variant="outline" onClick={filters.clear}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : filters.vista === "mapa" ? (
              <React.Suspense fallback={<MapSkeleton />}>
                <PetsMap
                  mascotas={query.data}
                  origen={filters.origen}
                  radioKm={filters.origen ? filters.radio : undefined}
                  className="h-[65vh] min-h-[420px]"
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Las ubicaciones son aproximadas y corresponden a la sede u hogar de paso de cada fundación.
                </p>
              </React.Suspense>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {query.data.map((m) => (
                  <li key={m._id} className="animate-fade-up">
                    <PetCard mascota={m} className="h-full" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Filtros en móvil y tableta */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="gap-0 p-0">
          <SheetHeader className="pb-4">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Los resultados se actualizan al seleccionar cada opción.</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-6 pb-6">
            <CatalogFilters filters={filters} />
          </div>
          <div className="flex gap-3 border-t p-4">
            <Button variant="outline" className="flex-1" onClick={filters.clear} disabled={filters.activeCount === 0}>
              Limpiar
            </Button>
            <Button className="flex-1" onClick={() => setSheetOpen(false)}>
              Ver {total} {total === 1 ? "resultado" : "resultados"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ActiveFilters({ filters }: { filters: Filters }) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.especie) chips.push({ key: "especie", label: ESPECIE_PLURAL[filters.especie], onRemove: () => filters.update({ especie: null }) });
  if (filters.tamano) chips.push({ key: "tamano", label: TAMANO_LABEL[filters.tamano], onRemove: () => filters.update({ tamano: null }) });
  if (filters.etapa) chips.push({ key: "etapa", label: ETAPA_LABEL[filters.etapa].split(" (")[0], onRemove: () => filters.update({ etapa: null }) });
  filters.temperamento.forEach((t) =>
    chips.push({
      key: t,
      label: TEMPERAMENTO_LABEL[t],
      onRemove: () => filters.update({ temperamento: filters.temperamento.filter((x) => x !== t).join(",") || null }),
    }),
  );
  if (filters.origen)
    chips.push({ key: "origen", label: `${filters.radio} km · ${filters.origen.etiqueta}`, onRemove: () => filters.setOrigenLocalidad(null) });

  if (chips.length === 0) return null;

  return (
    <ul className="mb-5 flex flex-wrap items-center gap-2" aria-label="Filtros aplicados">
      {chips.map((c) => (
        <li key={c.key}>
          <button
            type="button"
            onClick={c.onRemove}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft py-1 pl-3 pr-2 text-xs font-semibold text-terracota-800 transition-colors hover:bg-terracota-200"
            aria-label={`Quitar filtro ${c.label}`}
          >
            {c.label}
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </li>
      ))}
      <li>
        <Button variant="link" size="sm" className="h-auto px-1 text-xs" onClick={filters.clear}>
          Limpiar todo
        </Button>
      </li>
    </ul>
  );
}

function MapSkeleton() {
  return <Skeleton className="h-[65vh] min-h-[420px] rounded-2xl" />;
}

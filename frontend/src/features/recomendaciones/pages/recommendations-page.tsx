import { Check, ClipboardCheck, Info, PencilLine, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/features/auth/auth-context";
import { PetCard, PetGridSkeleton } from "@/features/mascotas/components/pet-card";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ESPECIE_PLURAL, TAMANO_LABEL, TIPO_VIVIENDA_LABEL } from "@/lib/labels";
import { paths } from "@/routes/paths";
import type { PerfilEstiloVida, Recomendacion } from "@/types";

import { CompatibilityRing, nivelCompatibilidad } from "../components/compatibility-ring";
import { useRecomendaciones } from "../hooks";

export default function RecommendationsPage() {
  useDocumentTitle("Recomendaciones");
  const { usuario } = useAuth();
  const perfil = usuario?.perfil_estilo_vida;
  const query = useRecomendaciones();

  if (!perfil) {
    return (
      <div className="page">
        <PageHeader eyebrow="Para usted" title="Recomendaciones" />
        <EmptyState
          icon={ClipboardCheck}
          title="Primero cuéntenos sobre su hogar"
          description="Complete su perfil de estilo de vida para calcular qué mascotas son más compatibles con su vivienda, su tiempo disponible y su familia."
          action={
            <Button asChild size="lg">
              <Link to={paths.adoptante.perfil}>Completar mi perfil</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Para usted"
        title="Recomendaciones"
        description="Mascotas ordenadas según su compatibilidad con su perfil de estilo de vida."
        actions={
          <Button asChild variant="outline">
            <Link to={paths.adoptante.perfil}>
              <PencilLine aria-hidden="true" />
              Editar perfil
            </Link>
          </Button>
        }
      />

      <ProfileStrip perfil={perfil} />

      {query.isPending ? (
        <PetGridSkeleton count={6} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Por ahora no hay mascotas compatibles"
          description="Ninguna mascota disponible alcanza una compatibilidad suficiente con su perfil. Puede ampliar sus preferencias o explorar el catálogo completo."
          action={
            <>
              <Button asChild variant="outline">
                <Link to={paths.adoptante.perfil}>Ajustar preferencias</Link>
              </Button>
              <Button asChild>
                <Link to={paths.mascotas}>
                  <Search aria-hidden="true" />
                  Ver catálogo
                </Link>
              </Button>
            </>
          }
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.map((r, i) => (
            <li key={r.mascota._id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <RecommendationCard recomendacion={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecommendationCard({ recomendacion }: { recomendacion: Recomendacion }) {
  const { mascota, compatibilidad, razones } = recomendacion;
  const nivel = nivelCompatibilidad(compatibilidad);

  return (
    <PetCard
      mascota={mascota}
      className="h-full"
      footer={
        <div className="mt-1 rounded-xl bg-muted/60 p-3">
          <div className="flex items-center gap-3">
            <CompatibilityRing value={compatibilidad} size={52} />
            <div>
              <p className={`text-sm font-bold ${nivel.text}`}>{nivel.label}</p>
              <p className="text-xs text-muted-foreground">con su perfil de estilo de vida</p>
            </div>
          </div>
          {razones.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5" aria-label={`Por qué le recomendamos a ${mascota.nombre}`}>
              {razones.map((razon) => (
                <li key={razon} className="flex gap-2 text-xs text-arena-700">
                  <Check className="mt-px size-3.5 shrink-0 text-success" strokeWidth={3} aria-hidden="true" />
                  {razon}
                </li>
              ))}
            </ul>
          )}
        </div>
      }
    />
  );
}

/** Resumen compacto del perfil sobre el que se calculan las recomendaciones. */
function ProfileStrip({ perfil }: { perfil: PerfilEstiloVida }) {
  const chips = [
    TIPO_VIVIENDA_LABEL[perfil.tipo_vivienda],
    perfil.tiene_patio ? "Con patio" : "Sin patio",
    `${perfil.horas_disponibles} h al día`,
    perfil.tiene_ninos ? "Con niños" : "Sin niños",
    perfil.tiene_otras_mascotas && perfil.otras_mascotas.length
      ? `Con ${perfil.otras_mascotas.map((e) => ESPECIE_PLURAL[e].toLowerCase()).join(" y ")}`
      : "Sin otras mascotas",
    ...perfil.especies_preferidas.map((e) => ESPECIE_PLURAL[e]),
    ...perfil.tamanos_preferidos.map((t) => TAMANO_LABEL[t]),
  ];

  return (
    <div className="mb-8 flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft sm:flex-row sm:items-center">
      <p className="shrink-0 text-sm font-semibold">Su perfil:</p>
      <ul className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <li key={c}>
            <Badge variant="secondary">{c}</Badge>
          </li>
        ))}
      </ul>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="shrink-0 sm:ml-auto">
            <Info aria-hidden="true" />
            ¿Cómo se calcula?
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-5 text-sm">
          <p className="font-semibold">Cálculo de compatibilidad</p>
          <p className="mt-2 text-muted-foreground">
            Comparamos su perfil con cada mascota disponible y asignamos un puntaje de 0 a 100:
          </p>
          <ul className="mt-3 flex flex-col gap-1 text-muted-foreground">
            <li>Especie preferida: 20 puntos</li>
            <li>Espacio de la vivienda: 20</li>
            <li>Tiempo disponible frente a su energía: 15</li>
            <li>Tamaño preferido: 10</li>
            <li>Convivencia con niños: 10</li>
            <li>Convivencia con otras mascotas: 10</li>
            <li>Cercanía a su ubicación: 10</li>
            <li>Experiencia previa: 5</li>
          </ul>
          <p className="mt-3 text-muted-foreground">Solo se muestran mascotas con 60 puntos o más.</p>
        </PopoverContent>
      </Popover>
    </div>
  );
}

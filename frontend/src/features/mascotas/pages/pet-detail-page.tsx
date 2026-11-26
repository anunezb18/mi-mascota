import { ArrowLeft, Building2, CalendarDays, Mail, MapPin, Phone, SearchX } from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoMascotaBadge } from "@/components/ui/status-badge";
import { AdoptionRequestPanel } from "@/features/solicitudes/components/adoption-request-panel";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ApiError } from "@/lib/api-client";
import { formatAge, formatDate } from "@/lib/format";
import { ESPECIE_LABEL, SEXO_LABEL, TAMANO_LABEL, TEMPERAMENTO_LABEL } from "@/lib/labels";
import { paths } from "@/routes/paths";
import type { Mascota } from "@/types";

import { MedicalTimeline } from "../components/medical-timeline";
import { PetGallery } from "../components/pet-gallery";
import { SexIcon } from "../components/sex-icon";
import { SpeciesAttributes } from "../components/species-attributes";
import { useMascota } from "../hooks";

const PetsMap = React.lazy(() => import("../components/pets-map"));

export default function PetDetailPage() {
  const { id } = useParams();
  const query = useMascota(id);
  useDocumentTitle(query.data?.nombre ?? "Detalle de la mascota");

  return (
    <div className="page">
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4">
        <Link to={paths.mascotas}>
          <ArrowLeft aria-hidden="true" />
          Mascotas en adopción
        </Link>
      </Button>

      {query.isPending ? (
        <DetailSkeleton />
      ) : query.isError ? (
        query.error instanceof ApiError && query.error.status === 404 ? (
          <EmptyState
            icon={SearchX}
            title="Esta mascota no está disponible"
            description="Es posible que haya sido retirada de la plataforma o que el enlace sea incorrecto."
            action={
              <Button asChild>
                <Link to={paths.mascotas}>Ver mascotas en adopción</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )
      ) : (
        <PetDetail mascota={query.data} />
      )}
    </div>
  );
}

function PetDetail({ mascota }: { mascota: Mascota }) {
  const esterilizadoLabel = mascota.sexo === "hembra" ? "Esterilizada" : "Esterilizado";
  const facts = [
    { label: "Edad", value: formatAge(mascota.edad_meses) },
    { label: "Sexo", value: SEXO_LABEL[mascota.sexo] },
    { label: "Tamaño", value: TAMANO_LABEL[mascota.tamano] },
    { label: esterilizadoLabel, value: mascota.esterilizado ? "Sí" : "No" },
  ];
  const [lng, lat] = mascota.ubicacion.coordinates;

  return (
    // En móvil: galería, resumen y secciones. En escritorio el resumen ocupa la columna derecha fija.
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-x-12">
      <div className="min-w-0 lg:col-start-1">
        <PetGallery mascota={mascota} />
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--navbar-height)+1.5rem)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <Summary mascota={mascota} facts={facts} />
        <FoundationCard mascota={mascota} />
      </aside>

      <div className="flex min-w-0 flex-col gap-10 lg:col-start-1">
        <section aria-labelledby="sobre">
          <h2 id="sobre" className="font-display text-2xl font-semibold">
            Sobre {mascota.nombre}
          </h2>
          <p className="mt-3 leading-relaxed text-arena-700 text-pretty">{mascota.descripcion}</p>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Temperamento">
            {mascota.temperamento.map((t) => (
              <li key={t}>
                <Badge variant="soft" className="px-3 py-1 text-sm">
                  {TEMPERAMENTO_LABEL[t]}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="atributos">
          <h2 id="atributos" className="font-display text-2xl font-semibold">
            Características de {ESPECIE_LABEL[mascota.especie].toLowerCase()}
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">Información específica de la especie reportada por la fundación.</p>
          <SpeciesAttributes atributos={mascota.atributos_especie} />
        </section>

        <section aria-labelledby="historial">
          <h2 id="historial" className="font-display text-2xl font-semibold">
            Historial médico
          </h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            {mascota.historial_medico.length} {mascota.historial_medico.length === 1 ? "registro" : "registros"} del más
            reciente al más antiguo.
          </p>
          <MedicalTimeline registros={mascota.historial_medico} />
        </section>

        <section aria-labelledby="ubicacion">
          <h2 id="ubicacion" className="font-display text-2xl font-semibold">
            Ubicación aproximada
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Sede u hogar de paso en {mascota.fundacion.localidad ? `${mascota.fundacion.localidad}, ` : ""}
            {mascota.fundacion.ciudad}.
          </p>
          <React.Suspense fallback={<Skeleton className="h-72 rounded-2xl" />}>
            <PetsMap
              mascotas={[mascota]}
              popups={false}
              zoom={14}
              className="h-72"
              origen={null}
              key={`${lat},${lng}`}
            />
          </React.Suspense>
        </section>
      </div>
    </div>
  );
}

function Summary({ mascota, facts }: { mascota: Mascota; facts: { label: string; value: string }[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 font-display text-display-sm font-semibold">
            {mascota.nombre}
            <SexIcon sexo={mascota.sexo} className="size-5" />
          </h1>
          <p className="mt-1 text-muted-foreground">
            {ESPECIE_LABEL[mascota.especie]} · {mascota.raza}
          </p>
        </div>
        <EstadoMascotaBadge estado={mascota.estado} className="mt-2 shrink-0" />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        {facts.map((f) => (
          <div key={f.label} className="rounded-xl bg-muted/60 px-4 py-3">
            <dt className="text-xs text-muted-foreground">{f.label}</dt>
            <dd className="mt-0.5 font-semibold">{f.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" aria-hidden="true" />
        Publicado el {formatDate(mascota.fecha_publicacion)}
        {mascota.distancia_km !== undefined && ` · a ${mascota.distancia_km} km`}
      </p>

      <div className="mt-6">
        <AdoptionRequestPanel mascota={mascota} />
      </div>
    </Card>
  );
}

function FoundationCard({ mascota }: { mascota: Mascota }) {
  const f = mascota.fundacion;
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 pb-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary-soft text-secondary">
          <Building2 className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Publicado por</p>
          <CardTitle className="truncate text-lg">{f.nombre}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2.5 text-sm">
          <li className="flex items-center gap-2.5">
            <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {f.localidad ? `${f.localidad}, ${f.ciudad}` : f.ciudad}
          </li>
          {f.telefono && (
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <a href={`tel:${f.telefono}`} className="hover:text-primary hover:underline">
                {f.telefono}
              </a>
            </li>
          )}
          {f.correo && (
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <a href={`mailto:${f.correo}`} className="truncate hover:text-primary hover:underline">
                {f.correo}
              </a>
            </li>
          )}
        </ul>
        <p className="mt-4 rounded-xl bg-secondary-soft/60 p-3 text-xs text-pino-800">
          Fundación validada por el equipo de MiMascota.
        </p>
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Cargando mascota" className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
      <div className="flex flex-col gap-6">
        <Skeleton className="aspect-[4/3] rounded-3xl" />
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

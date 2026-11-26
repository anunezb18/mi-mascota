import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoMascotaBadge } from "@/components/ui/status-badge";
import { formatAge, formatDistance } from "@/lib/format";
import { TAMANO_LABEL, TEMPERAMENTO_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Mascota } from "@/types";

import { PetImage } from "./pet-image";
import { SexIcon } from "./sex-icon";

interface PetCardProps {
  mascota: Mascota;
  className?: string;
  /** Contenido extra al pie (p. ej. compatibilidad en recomendaciones). */
  footer?: React.ReactNode;
}

/** Tarjeta de mascota. Toda la tarjeta es clicable mediante el enlace del nombre. */
export function PetCard({ mascota, className, footer }: PetCardProps) {
  const temperamentos = mascota.temperamento.slice(0, 3);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all duration-300 ease-gentle",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <PetImage
          src={mascota.fotos[0]}
          alt={`Foto de ${mascota.nombre}, ${mascota.raza}`}
          especie={mascota.especie}
          className="transition-transform duration-700 ease-gentle group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          {mascota.estado !== "disponible" ? (
            <EstadoMascotaBadge estado={mascota.estado} className="shadow-soft" />
          ) : (
            <span />
          )}
          {mascota.distancia_km !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-xs font-bold shadow-soft backdrop-blur">
              <MapPin className="size-3.5 text-primary" aria-hidden="true" />
              <span className="sr-only">A </span>
              {formatDistance(mascota.distancia_km)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-xl font-semibold leading-tight">
              <Link
                to={paths.mascota(mascota._id)}
                className="rounded after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-0"
              >
                {mascota.nombre}
              </Link>
            </h3>
            <SexIcon sexo={mascota.sexo} />
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{mascota.raza}</p>
        </div>

        <dl className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          <div className="flex gap-1">
            <dt className="sr-only">Edad</dt>
            <dd className="font-semibold">{formatAge(mascota.edad_meses)}</dd>
          </div>
          <span aria-hidden="true" className="text-arena-300">
            •
          </span>
          <div className="flex gap-1">
            <dt className="sr-only">Tamaño</dt>
            <dd className="font-semibold">{TAMANO_LABEL[mascota.tamano]}</dd>
          </div>
          {mascota.fundacion.localidad && (
            <>
              <span aria-hidden="true" className="text-arena-300">
                •
              </span>
              <div className="flex gap-1">
                <dt className="sr-only">Localidad</dt>
                <dd className="text-muted-foreground">{mascota.fundacion.localidad}</dd>
              </div>
            </>
          )}
        </dl>

        <ul className="mt-auto flex flex-wrap gap-1.5" aria-label="Temperamento">
          {temperamentos.map((t) => (
            <li key={t}>
              <Badge variant="soft">{TEMPERAMENTO_LABEL[t]}</Badge>
            </li>
          ))}
        </ul>
        {footer && <div className="relative z-10">{footer}</div>}
      </div>
    </article>
  );
}

export function PetCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function PetGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando mascotas" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <PetCardSkeleton key={i} />
      ))}
    </div>
  );
}

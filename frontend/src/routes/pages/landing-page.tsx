import {
  ArrowRight,
  BellRing,
  Building2,
  ClipboardCheck,
  HeartHandshake,
  type LucideIcon,
  MapPinned,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PetCard, PetCardSkeleton } from "@/features/mascotas/components/pet-card";
import { PetImage } from "@/features/mascotas/components/pet-image";
import { useMascotas } from "@/features/mascotas/hooks";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { LOCALIDADES_BOGOTA } from "@/lib/bogota";
import { ESPECIE_PLURAL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Especie, Mascota } from "@/types";

const DESTACADAS = { limite: 8 } as const;

export default function LandingPage() {
  useDocumentTitle();
  const destacadas = useMascotas(DESTACADAS);

  return (
    <>
      <Hero mascotas={destacadas.data} loading={destacadas.isPending} />
      <HowItWorks />
      <Featured query={destacadas} />
      <RoleCallToAction />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Hero({ mascotas, loading }: { mascotas?: Mascota[]; loading: boolean }) {
  const collage = mascotas?.slice(0, 3) ?? [];

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]" />
      <div className="container relative grid items-center gap-12 pb-16 pt-10 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:pb-24">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-pino-800">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Fundaciones validadas en Bogotá
          </p>
          <h1 className="mt-5 font-display text-display-md font-semibold sm:text-display-lg xl:text-display-xl">
            Un hogar para ellos,{" "}
            <span className="relative whitespace-nowrap text-primary">
              un compañero
              <Underline className="absolute -bottom-2 left-0 w-full text-terracota-300" />
            </span>{" "}
            para usted.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
            MiMascota conecta fundaciones de animales con personas que quieren adoptar. Encuentre mascotas cerca de
            usted, conozca su historial médico y su compatibilidad con su estilo de vida, y siga cada solicitud en
            tiempo real.
          </p>

          <QuickSearch />

          <ul className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
            {[
              { icon: Building2, text: "Fundaciones verificadas" },
              { icon: Sparkles, text: "Recomendaciones compatibles" },
              { icon: BellRing, text: "Seguimiento en tiempo real" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 font-semibold text-arena-700">
                <Icon className="size-4 text-secondary" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <HeroCollage mascotas={collage} loading={loading} />
      </div>
    </section>
  );
}

function QuickSearch() {
  const navigate = useNavigate();
  const [especie, setEspecie] = React.useState<Especie | "todas">("todas");
  const [localidad, setLocalidad] = React.useState<string>("cualquiera");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (especie !== "todas") params.set("especie", especie);
    if (localidad !== "cualquiera") params.set("localidad", localidad);
    navigate(`${paths.mascotas}${params.size ? `?${params}` : ""}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label="Búsqueda rápida de mascotas"
      className="mt-8 flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-card sm:flex-row sm:items-center sm:rounded-full"
    >
      <label className="sr-only" htmlFor="qs-especie">
        Especie
      </label>
      <Select value={especie} onValueChange={(v) => setEspecie(v as Especie | "todas")}>
        <SelectTrigger id="qs-especie" className="border-0 shadow-none sm:w-44 sm:rounded-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las especies</SelectItem>
          {(Object.keys(ESPECIE_PLURAL) as Especie[]).map((e) => (
            <SelectItem key={e} value={e}>
              {ESPECIE_PLURAL[e]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span aria-hidden="true" className="hidden h-6 w-px bg-border sm:block" />
      <label className="sr-only" htmlFor="qs-localidad">
        Cerca de
      </label>
      <Select value={localidad} onValueChange={setLocalidad}>
        <SelectTrigger id="qs-localidad" className="border-0 shadow-none sm:flex-1 sm:rounded-full">
          <div className="flex min-w-0 items-center gap-2">
            <MapPinned className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">
              <SelectValue />
            </span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cualquiera">Cualquier localidad</SelectItem>
          {LOCALIDADES_BOGOTA.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              Cerca de {l.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="lg" className="sm:h-11">
        <Search aria-hidden="true" />
        Buscar
      </Button>
    </form>
  );
}

function HeroCollage({ mascotas, loading }: { mascotas: Mascota[]; loading: boolean }) {
  const shapes = [
    "col-span-2 row-span-2 rounded-[2.5rem_2.5rem_2.5rem_0.75rem]",
    "rounded-[2rem_0.75rem_2rem_2rem]",
    "rounded-[0.75rem_2rem_2rem_2rem]",
  ];

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden={loading || undefined}>
      <div aria-hidden="true" className="absolute -right-10 -top-10 size-64 rounded-full bg-terracota-200/50 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-12 -left-8 size-56 rounded-full bg-pino-200/50 blur-3xl" />
      <div className="relative grid aspect-[5/4] grid-cols-3 grid-rows-2 gap-3 sm:gap-4">
        {[0, 1, 2].map((i) => {
          const m = mascotas[i];
          return (
            <div
              key={i}
              className={cn("relative overflow-hidden shadow-lift", shapes[i], i === 0 ? "" : "col-span-1")}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              {loading || !m ? (
                <Skeleton className="size-full rounded-none" />
              ) : (
                <Link to={paths.mascota(m._id)} className="group block size-full" aria-label={`Conocer a ${m.nombre}`}>
                  <PetImage
                    src={m.fotos[0]}
                    alt={`Foto de ${m.nombre}`}
                    especie={m.especie}
                    className="transition-transform duration-700 ease-gentle group-hover:scale-105"
                  />
                  <span className="absolute bottom-3 left-3 rounded-full bg-card/95 px-3 py-1 text-sm font-bold shadow-soft backdrop-blur">
                    {m.nombre}
                  </span>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Tarjeta flotante ilustrativa del indicador de compatibilidad */}
      <div className="absolute -bottom-6 right-4 hidden items-center gap-3 rounded-2xl border bg-card p-3 pr-4 shadow-overlay sm:flex">
        <span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground">
          <HeartHandshake className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Compatibilidad con su hogar</p>
          <p className="font-display text-lg font-semibold leading-tight">Calculada a partir de su perfil</p>
        </div>
      </div>
    </div>
  );
}

function Underline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 12" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <path d="M2 9c40-6 90-8 140-5 25 1.5 50 3.5 76 1" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ClipboardCheck,
    title: "Cuéntenos sobre su hogar",
    text: "Complete su perfil de estilo de vida: tipo de vivienda, tiempo disponible y si convive con niños u otras mascotas.",
  },
  {
    icon: MapPinned,
    title: "Encuentre a su compañero",
    text: "Busque por especie, tamaño, edad o temperamento, explore el mapa de mascotas cercanas y revise las recomendaciones compatibles.",
  },
  {
    icon: BellRing,
    title: "Solicite y haga seguimiento",
    text: "Envíe su solicitud a la fundación y reciba en tiempo real la notificación cuando sea aprobada o rechazada.",
  },
];

function HowItWorks() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="border-y bg-card py-16 md:py-22">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Cómo funciona</p>
          <h2 id="como-funciona-titulo" className="mt-2 font-display text-display-sm font-semibold md:text-display-md">
            Adoptar en tres pasos
          </h2>
          <p className="mt-3 text-muted-foreground">
            Un proceso claro para usted y para la fundación, con la información necesaria para tomar una decisión
            responsable.
          </p>
        </div>

        <ol className="relative mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
          <div
            aria-hidden="true"
            className="absolute left-[16.6%] right-[16.6%] top-7 hidden border-t-2 border-dashed border-arena-300 md:block"
          />
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative flex flex-col items-center text-center">
              <span className="relative grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card ring-8 ring-card">
                <Icon className="size-6" aria-hidden="true" />
                <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Featured({ query }: { query: ReturnType<typeof useMascotas> }) {
  return (
    <section aria-labelledby="destacadas-titulo" className="container py-16 md:py-22">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Recién publicadas</p>
          <h2 id="destacadas-titulo" className="mt-2 font-display text-display-sm font-semibold md:text-display-md">
            Esperan un hogar
          </h2>
        </div>
        <Button asChild variant="outline">
          <Link to={paths.mascotas}>
            Ver todas las mascotas
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {query.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Cargando mascotas">
          {Array.from({ length: 4 }, (_, i) => (
            <PetCardSkeleton key={i} />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {query.data.slice(0, 8).map((m) => (
            <PetCard key={m._id} mascota={m} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function RoleCallToAction() {
  return (
    <section aria-label="Crear una cuenta" className="container pb-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground shadow-lift md:p-10">
          <div aria-hidden="true" className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10" />
          <HeartHandshake className="size-10 text-terracota-200" aria-hidden="true" />
          <h2 className="mt-5 font-display text-display-sm font-semibold">Quiero adoptar</h2>
          <p className="mt-3 max-w-md text-terracota-50/90">
            Cree su cuenta de adoptante, complete su perfil de estilo de vida y reciba recomendaciones de mascotas
            compatibles con su hogar.
          </p>
          <Button asChild size="lg" variant="outline" className="mt-7 border-transparent bg-card text-terracota-800 hover:bg-terracota-50">
            <Link to={`${paths.registro}?rol=adoptante`}>
              Registrarme como adoptante
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-secondary p-8 text-secondary-foreground shadow-lift md:p-10">
          <div aria-hidden="true" className="absolute -bottom-20 -right-10 size-64 rounded-full bg-white/10" />
          <Building2 className="size-10 text-pino-200" aria-hidden="true" />
          <h2 className="mt-5 font-display text-display-sm font-semibold">Somos una fundación</h2>
          <p className="mt-3 max-w-md text-pino-50/90">
            Publique sus mascotas con fotos e historial médico, reciba solicitudes y gestione las adopciones desde un
            solo panel. El registro se activa tras la validación del administrador.
          </p>
          <Button asChild size="lg" variant="outline" className="mt-7 border-transparent bg-card text-pino-800 hover:bg-pino-50">
            <Link to={`${paths.registro}?rol=fundacion`}>
              Registrar mi fundación
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

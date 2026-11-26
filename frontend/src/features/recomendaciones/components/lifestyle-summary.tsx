import { Baby, Clock, GraduationCap, Heart, Home, PawPrint, Ruler, Trees } from "lucide-react";

import { ESPECIE_PLURAL, TAMANO_LABEL, TIPO_VIVIENDA_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { PerfilEstiloVida } from "@/types";

const listar = (items: string[]) => (items.length ? items.join(", ") : "Sin preferencia");

/** Resumen del perfil de estilo de vida. Lo usan el adoptante y la fundación al revisar solicitudes. */
export function LifestyleSummary({ perfil, compact = false }: { perfil: PerfilEstiloVida; compact?: boolean }) {
  const items = [
    { icon: Home, label: "Vivienda", value: TIPO_VIVIENDA_LABEL[perfil.tipo_vivienda] },
    { icon: Trees, label: "Patio o zona verde", value: perfil.tiene_patio ? "Sí" : "No" },
    { icon: Clock, label: "Tiempo disponible", value: `${perfil.horas_disponibles} h al día` },
    { icon: Baby, label: "Niños en el hogar", value: perfil.tiene_ninos ? "Sí" : "No" },
    {
      icon: PawPrint,
      label: "Otras mascotas",
      value: perfil.tiene_otras_mascotas ? listar(perfil.otras_mascotas.map((e) => ESPECIE_PLURAL[e])) : "No",
    },
    { icon: GraduationCap, label: "Experiencia previa", value: perfil.experiencia_previa ? "Sí" : "No" },
    { icon: Heart, label: "Especies de interés", value: listar(perfil.especies_preferidas.map((e) => ESPECIE_PLURAL[e])) },
    { icon: Ruler, label: "Tamaños de interés", value: listar(perfil.tamanos_preferidos.map((t) => TAMANO_LABEL[t])) },
  ];

  return (
    <dl className={cn("grid gap-x-4 gap-y-3", compact ? "grid-cols-1 sm:grid-cols-2" : "sm:grid-cols-2")}>
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary-soft text-secondary">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

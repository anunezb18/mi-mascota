import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

/** Pregunta del asistente: título accesible (legend), ayuda y error asociados al grupo. */
export function Question({
  title,
  hint,
  error,
  children,
}: {
  title: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <fieldset aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}>
      <legend className="text-base font-semibold">{title}</legend>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <div className="mt-3">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Respuesta Sí / No en formato de tarjetas grandes, cómodas en pantallas táctiles. */
export function YesNo({
  value,
  onChange,
  labels = ["Sí", "No"],
  invalid,
}: {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  labels?: [string, string];
  invalid?: boolean;
}) {
  return (
    <RadioGroup
      value={value === undefined ? "" : value ? "si" : "no"}
      onValueChange={(v) => onChange(v === "si")}
      className="grid-cols-2"
      aria-invalid={invalid || undefined}
    >
      <RadioCard value="si" className="items-center py-3.5 text-center font-semibold">
        {labels[0]}
      </RadioCard>
      <RadioCard value="no" className="items-center py-3.5 text-center font-semibold">
        {labels[1]}
      </RadioCard>
    </RadioGroup>
  );
}

/** Opción con ícono, título y descripción (tipo de vivienda). */
export function OptionCard({
  value,
  icon: Icon,
  title,
  description,
  selected,
}: {
  value: string;
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
}) {
  return (
    <RadioCard value={value} className="gap-3 p-5">
      <span
        className={cn(
          "grid size-11 place-items-center rounded-xl transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="font-semibold">{title}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </RadioCard>
  );
}

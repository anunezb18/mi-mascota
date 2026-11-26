import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  /** id del control; se genera uno si no se indica. */
  id?: string;
  label: React.ReactNode;
  /** Mensaje de error de validación (React Hook Form + Zod). */
  error?: string;
  /** Texto de ayuda bajo el campo. */
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  /** Un único control de formulario. Recibe id, aria-invalid y aria-describedby. */
  children: React.ReactElement;
}

/**
 * Envoltura accesible para campos: asocia etiqueta, ayuda y error con el control
 * mediante `htmlFor`, `aria-describedby` y `aria-invalid`.
 */
export function FormField({ id, label, error, hint, required, className, children }: FormFieldProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = React.cloneElement(children, {
    id: fieldId,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    "aria-required": required || undefined,
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

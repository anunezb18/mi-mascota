import { cn } from "@/lib/utils";
import type { Sexo } from "@/types";

/** Símbolo de sexo (♂ / ♀) con etiqueta accesible. */
export function SexIcon({ sexo, className }: { sexo: Sexo; className?: string }) {
  const macho = sexo === "macho";
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={macho ? "Macho" : "Hembra"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4 shrink-0", macho ? "text-info" : "text-primary", className)}
    >
      {macho ? (
        <>
          <circle cx="10" cy="14" r="6" />
          <path d="M14.5 9.5 20 4M15 4h5v5" />
        </>
      ) : (
        <>
          <circle cx="12" cy="9" r="6" />
          <path d="M12 15v7M9 19h6" />
        </>
      )}
    </svg>
  );
}

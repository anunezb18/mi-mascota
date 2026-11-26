import { LogoMark } from "@/components/ui/logo";

/** Indicador de carga a pantalla completa (verificación de sesión). */
export function PageLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <LogoMark className="size-12 animate-pulse" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

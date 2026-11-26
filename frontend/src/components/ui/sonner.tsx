import * as React from "react";
import { Toaster as SonnerToaster, toast, useSonner } from "sonner";

/** Tiempo máximo que un aviso permanece visible. */
const DURACION_MS = 5000;

/**
 * Sonner pausa el temporizador mientras el cursor está sobre los avisos o tienen el foco,
 * y como aparecen junto a la campana y el menú de usuario podían quedarse abiertos
 * indefinidamente. Este efecto cierra cada aviso a los 5 segundos aunque esté pausado;
 * el usuario puede cerrarlo antes con la X.
 */
function useCierreAutomatico() {
  const { toasts } = useSonner();
  const programados = React.useRef(new Map<string | number, ReturnType<typeof setTimeout>>());

  React.useEffect(() => {
    const vigentes = new Set(toasts.map((t) => t.id));
    for (const t of toasts) {
      if (!programados.current.has(t.id)) {
        programados.current.set(
          t.id,
          setTimeout(() => toast.dismiss(t.id), DURACION_MS),
        );
      }
    }
    // Los avisos cerrados antes (con la X) ya no necesitan su temporizador
    for (const [id, timer] of programados.current) {
      if (!vigentes.has(id)) {
        clearTimeout(timer);
        programados.current.delete(id);
      }
    }
  }, [toasts]);

  React.useEffect(() => {
    const timers = programados.current;
    return () => timers.forEach(clearTimeout);
  }, []);
}

/** Contenedor de toasts con los estilos del sistema de diseño. */
export function Toaster() {
  useCierreAutomatico();
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      duration={DURACION_MS}
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "group !rounded-xl !border !border-border !bg-card !text-foreground !shadow-overlay !font-sans !gap-3",
          title: "!font-semibold !text-sm",
          description: "!text-muted-foreground !text-sm",
          actionButton: "!bg-primary !text-primary-foreground !rounded-full !font-semibold",
          cancelButton: "!bg-muted !text-foreground !rounded-full",
          closeButton: "!bg-card !border-border !text-muted-foreground hover:!text-foreground",
          success: "[&_[data-icon]]:!text-success",
          error: "[&_[data-icon]]:!text-destructive",
          warning: "[&_[data-icon]]:!text-warning",
          info: "[&_[data-icon]]:!text-info",
        },
      }}
    />
  );
}

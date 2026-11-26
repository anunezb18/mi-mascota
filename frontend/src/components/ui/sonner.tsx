import { Toaster as SonnerToaster } from "sonner";

/** Contenedor de toasts con los estilos del sistema de diseño. */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
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

import { Home, RotateCw, TriangleAlert } from "lucide-react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Logo } from "@/components/ui/logo";
import { paths } from "@/routes/paths";

/** Error no controlado en una ruta (p. ej. falla al descargar una pantalla). */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const description = isRouteErrorResponse(error)
    ? `${error.status} · ${error.statusText}`
    : "Ocurrió un error inesperado al mostrar esta pantalla. Si el problema persiste, recargue la página.";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="container flex h-16 items-center">
        <Link to={paths.inicio} aria-label="MiMascota, ir al inicio">
          <Logo />
        </Link>
      </header>
      <main id="contenido" className="container grid flex-1 place-items-center py-12">
        <EmptyState
          tone="destructive"
          icon={TriangleAlert}
          title="Algo salió mal"
          description={description}
          className="w-full max-w-xl"
          action={
            <>
              <Button onClick={() => window.location.reload()}>
                <RotateCw aria-hidden="true" />
                Recargar
              </Button>
              <Button asChild variant="outline">
                <Link to={paths.inicio}>
                  <Home aria-hidden="true" />
                  Ir al inicio
                </Link>
              </Button>
            </>
          }
        />
      </main>
    </div>
  );
}

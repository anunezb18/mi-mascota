import { Outlet } from "react-router-dom";

import { Footer } from "./footer";
import { Navbar } from "./navbar";

/**
 * Layout del sitio: páginas públicas, del adoptante y comunes.
 * Con `contained`, envuelve el contenido en el contenedor estándar de página.
 */
export function SiteLayout({ contained = false }: { contained?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        {contained ? (
          <div className="page">
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  );
}

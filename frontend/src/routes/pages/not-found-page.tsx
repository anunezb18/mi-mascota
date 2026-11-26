import { ArrowLeft, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { paths } from "@/routes/paths";

export default function NotFoundPage() {
  useDocumentTitle("Página no encontrada");
  const navigate = useNavigate();

  return (
    <section className="container flex flex-col items-center py-16 text-center md:py-24">
      <div className="relative" aria-hidden="true">
        <p className="font-display text-[7rem] font-semibold leading-none tracking-tight text-arena-200 sm:text-[10rem]">
          4<span className="inline-block text-primary">0</span>4
        </p>
        <TrailOfPaws className="absolute -bottom-4 left-1/2 w-48 -translate-x-1/2 text-arena-300" />
      </div>
      <p className="mt-10 text-xs font-bold uppercase tracking-[0.14em] text-primary">Error 404</p>
      <h1 className="mt-2 font-display text-display-sm font-semibold md:text-display-md">
        No encontramos esta página
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground text-pretty">
        La dirección no existe o el contenido fue retirado. Si llegó aquí desde un enlace, es posible que la
        mascota ya haya sido adoptada.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft aria-hidden="true" />
          Volver
        </Button>
        <Button asChild>
          <Link to={paths.mascotas}>
            <Search aria-hidden="true" />
            Ver mascotas en adopción
          </Link>
        </Button>
      </div>
    </section>
  );
}

/** Rastro de huellas que se pierde: ilustración de la página 404. */
function TrailOfPaws({ className }: { className?: string }) {
  const paw = (x: number, y: number, r: number, o: number) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`} opacity={o}>
      <ellipse cx="0" cy="3" rx="4" ry="3.4" />
      <circle cx="-4.4" cy="-2.2" r="1.6" />
      <circle cx="-1.5" cy="-4.6" r="1.6" />
      <circle cx="1.5" cy="-4.6" r="1.6" />
      <circle cx="4.4" cy="-2.2" r="1.6" />
    </g>
  );
  return (
    <svg viewBox="0 0 200 30" className={className} fill="currentColor">
      {[paw(12, 20, 70, 1), paw(42, 12, 80, 0.85), paw(72, 20, 75, 0.7), paw(102, 12, 85, 0.5), paw(132, 20, 80, 0.3), paw(162, 12, 90, 0.15)]}
    </svg>
  );
}

import { Link } from "react-router-dom";

import { Logo } from "@/components/ui/logo";
import { paths } from "@/routes/paths";

const LINKS = [
  {
    title: "Adoptar",
    items: [
      { label: "Mascotas en adopción", to: paths.mascotas },
      { label: "Crear cuenta de adoptante", to: `${paths.registro}?rol=adoptante` },
      { label: "Ingresar", to: paths.ingresar },
    ],
  },
  {
    title: "Fundaciones",
    items: [
      { label: "Registrar una fundación", to: `${paths.registro}?rol=fundacion` },
      { label: "Panel de la fundación", to: paths.fundacion.panel },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-arena-900 text-arena-200">
      {/* Borde ondulado superior, motivo orgánico de la marca */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-6 w-full -translate-y-px fill-background"
      >
        <path d="M0 0h1440v14c-120 14-240 22-360 20S840 18 720 18 480 30 360 32 120 26 0 14V0Z" />
      </svg>

      <div className="container grid gap-10 pb-10 pt-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo inverted />
          <p className="mt-4 text-sm leading-relaxed text-arena-300">
            Conectamos fundaciones de animales con personas que quieren darles un hogar. Adopción responsable,
            información verificada y seguimiento de cada solicitud.
          </p>
        </div>
        {LINKS.map((group) => (
          <div key={group.title}>
            <h2 className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-arena-50">{group.title}</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="rounded text-sm text-arena-300 transition-colors hover:text-terracota-300 focus-visible:ring-offset-arena-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-6 text-xs text-arena-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MiMascota. Proyecto académico.</p>
          <p>Bases de Datos NoSQL · Ingeniería de Sistemas · Universidad Distrital Francisco José de Caldas</p>
        </div>
      </div>
    </footer>
  );
}

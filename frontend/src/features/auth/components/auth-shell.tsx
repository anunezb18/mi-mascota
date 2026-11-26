import { HeartHandshake, ShieldCheck } from "lucide-react";
import type * as React from "react";

import { Logo } from "@/components/ui/logo";

const IMAGEN = "https://images.dog.ceo/breeds/mix/uhie.jpg";

/**
 * Contenedor de login y registro: formulario a la izquierda y panel visual de
 * la marca a la derecha en pantallas grandes.
 */
export function AuthShell({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <section className="container py-8 md:py-12">
      <div className="grid overflow-hidden rounded-3xl border bg-card shadow-card lg:grid-cols-[1.15fr_0.85fr]">
        <div className={wide ? "p-6 sm:p-10 lg:p-12" : "p-6 sm:p-10 lg:px-16 lg:py-14"}>
          <div className={wide ? "mx-auto max-w-2xl" : "mx-auto max-w-md"}>
            <h1 className="font-display text-display-sm font-semibold">{title}</h1>
            <p className="mt-2 text-muted-foreground">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>

        <aside aria-hidden="true" className="relative hidden overflow-hidden bg-arena-900 lg:block">
          <img src={IMAGEN} alt="" className="absolute inset-0 size-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-arena-900 via-arena-900/40 to-transparent" />
          <div className="relative flex h-full flex-col justify-between p-10 text-arena-50">
            <Logo inverted />
            <div>
              <p className="font-display text-3xl font-semibold leading-tight">
                “Cada adopción responsable libera un cupo para rescatar a otro animal.”
              </p>
              <ul className="mt-8 flex flex-col gap-3 text-sm text-arena-200">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-terracota-300" />
                  Sus datos se usan solo para el proceso de adopción.
                </li>
                <li className="flex items-center gap-2">
                  <HeartHandshake className="size-4 text-terracota-300" />
                  Fundaciones validadas por el equipo de MiMascota.
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

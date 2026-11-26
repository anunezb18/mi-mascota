import { LogIn, UserPlus } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/auth-context";
import { ROL_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

import type { NavItem } from "./nav-config";

/** Grupo de enlaces del menú móvil; el título es opcional cuando hay un solo grupo. */
export interface NavGroup {
  titulo?: string;
  items: NavItem[];
}

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupos: NavGroup[];
}

/** Menú lateral para pantallas pequeñas y tabletas. */
export function MobileNav({ open, onOpenChange, grupos }: MobileNavProps) {
  const { usuario } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="gap-0 p-0">
        <div className="border-b px-6 py-5">
          <Logo />
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SheetDescription className="mt-3 text-sm">
            {usuario ? `${usuario.nombre} · ${ROL_LABEL[usuario.rol]}` : "Encuentre a su próximo compañero."}
          </SheetDescription>
        </div>

        <nav aria-label="Navegación móvil" className="flex-1 overflow-y-auto px-3 py-4">
          {grupos.map((grupo, i) => {
            const tituloId = `menu-movil-grupo-${i}`;
            return (
              <div key={grupo.titulo ?? i} className={cn(i > 0 && "mt-4 border-t pt-4")}>
                {grupo.titulo && (
                  <p id={tituloId} className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {grupo.titulo}
                  </p>
                )}
                <ul className="flex flex-col gap-1" aria-labelledby={grupo.titulo ? tituloId : undefined}>
                  {grupo.items.map(({ to, label, icon: Icon, end }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold transition-colors",
                            isActive ? "bg-primary-soft text-terracota-800" : "text-foreground hover:bg-accent",
                          )
                        }
                      >
                        <Icon className="size-5" aria-hidden="true" />
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {!usuario && (
          <div className="flex flex-col gap-2 border-t p-4">
            <Button asChild size="lg">
              <Link to={paths.registro}>
                <UserPlus aria-hidden="true" />
                Crear cuenta
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to={paths.ingresar}>
                <LogIn aria-hidden="true" />
                Ingresar
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

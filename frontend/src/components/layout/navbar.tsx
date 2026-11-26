import { LayoutDashboard, LogIn, Menu } from "lucide-react";
import * as React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/features/auth/auth-context";
import { NotificationBell } from "@/features/notificaciones/components/notification-bell";
import { useScrolled } from "@/hooks/use-scrolled";
import { ROL_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { homeForRole, paths } from "@/routes/paths";

import { MobileNav, type NavGroup } from "./mobile-nav";
import { CUENTA_NAV, esRolDePanel, PUBLIC_NAV, ROLE_NAV, SITIO_PUBLICO_NAV } from "./nav-config";
import { UserMenu } from "./user-menu";

interface NavbarProps {
  /** En los paneles la navegación principal está en la barra lateral (escritorio). */
  variant?: "site" | "panel";
}

export function Navbar({ variant = "site" }: NavbarProps) {
  const { usuario, status } = useAuth();
  const scrolled = useScrolled();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Cierra el menú móvil al navegar
  React.useEffect(() => setMobileOpen(false), [location.pathname]);

  const rolDePanel = usuario && esRolDePanel(usuario.rol) ? usuario.rol : null;
  // Fundación y administrador navegan su panel desde la barra lateral; en el sitio
  // público ven los enlaces públicos y un acceso directo a su panel.
  const items = usuario && !rolDePanel ? ROLE_NAV[usuario.rol] : PUBLIC_NAV;
  const gruposMovil: NavGroup[] = rolDePanel
    ? [
        { titulo: `Panel de ${ROL_LABEL[rolDePanel].toLowerCase()}`, items: ROLE_NAV[rolDePanel] },
        { titulo: "Cuenta", items: CUENTA_NAV },
        { titulo: "Sitio público", items: SITIO_PUBLICO_NAV },
      ]
    : [{ items }];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-[var(--navbar-height)] border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled || variant === "panel"
          ? "border-border/80 bg-background/85 shadow-soft backdrop-blur-md supports-[backdrop-filter]:bg-background/75"
          : "border-transparent bg-background",
      )}
    >
      <div className="container flex h-full items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 lg:hidden"
          aria-label="Abrir menú de navegación"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="!size-5" aria-hidden="true" />
        </Button>

        <Link to={paths.inicio} className="rounded-lg" aria-label="MiMascota, ir al inicio">
          <Logo />
        </Link>

        <nav
          aria-label="Navegación principal"
          className={cn("ml-6 hidden items-center gap-1 lg:flex", variant === "panel" && "lg:hidden")}
        >
          {items.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-3.5 -bottom-[0.6875rem] h-0.5 rounded-full bg-primary transition-transform duration-300 ease-gentle",
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {status === "loading" ? (
            <div className="size-10 animate-pulse rounded-full bg-muted" aria-hidden="true" />
          ) : usuario ? (
            <>
              {rolDePanel && variant === "site" && (
                <Button asChild variant="soft" size="sm" className="mr-1 hidden sm:inline-flex">
                  <Link to={homeForRole(rolDePanel)}>
                    <LayoutDashboard aria-hidden="true" />
                    Ir a mi panel
                  </Link>
                </Button>
              )}
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to={paths.ingresar}>
                  <LogIn aria-hidden="true" />
                  Ingresar
                </Link>
              </Button>
              <Button asChild>
                <Link to={paths.registro}>Crear cuenta</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} grupos={gruposMovil} />
    </header>
  );
}

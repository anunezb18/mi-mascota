import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "@/features/auth/auth-context";
import { FoundationStatusBanner } from "@/features/fundacion/components/foundation-status-banner";
import { ROL_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

import { Navbar } from "./navbar";
import { CUENTA_NAV, type NavItem, ROLE_NAV, SITIO_PUBLICO_NAV } from "./nav-config";

/**
 * Layout de los paneles de gestión (fundación y administrador): navbar superior
 * y barra lateral fija en escritorio. En móvil la navegación vive en el menú del navbar.
 * La barra lateral incluye, al final, los enlaces de regreso al sitio público.
 */
export function PanelLayout() {
  const { usuario } = useAuth();
  if (!usuario) return null;
  const items = ROLE_NAV[usuario.rol];

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar variant="panel" />
      <div className="container flex flex-1 gap-8 px-0 sm:px-0 lg:px-8">
        <aside className="sticky top-[var(--navbar-height)] hidden h-[calc(100dvh-var(--navbar-height))] w-60 shrink-0 flex-col overflow-y-auto py-8 lg:flex">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Panel de {ROL_LABEL[usuario.rol].toLowerCase()}
          </p>
          <nav aria-label="Navegación del panel">
            <SidebarList items={items} />
          </nav>

          <p className="mb-3 mt-7 px-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Cuenta</p>
          <nav aria-label="Cuenta">
            <SidebarList items={CUENTA_NAV} />
          </nav>

          <div className="mt-auto border-t pt-5">
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Sitio público</p>
            <nav aria-label="Sitio público">
              <SidebarList items={SITIO_PUBLICO_NAV} />
            </nav>
          </div>
        </aside>
        <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 px-4 py-8 focus:outline-none sm:px-6 md:py-10 lg:px-0">
          {usuario.rol === "fundacion" && <FoundationStatusBanner />}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarList({ items }: { items: NavItem[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-lg transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary-soft",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

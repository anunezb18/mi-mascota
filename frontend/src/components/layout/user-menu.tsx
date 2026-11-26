import { Bell, ChevronDown, ClipboardList, HeartHandshake, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/auth-context";
import { ROL_LABEL } from "@/lib/labels";
import { initials } from "@/lib/utils";
import { homeForRole, paths } from "@/routes/paths";

export function UserMenu() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  if (!usuario) return null;

  const handleLogout = () => {
    logout();
    navigate(paths.inicio);
    toast.success("Sesión cerrada", { description: "Esperamos verle pronto." });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full border border-transparent p-1 pr-2 transition-colors hover:border-border hover:bg-card data-[state=open]:border-border data-[state=open]:bg-card"
        aria-label={`Menú de la cuenta de ${usuario.nombre}`}
      >
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{initials(usuario.nombre)}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[9rem] truncate text-sm font-semibold xl:inline">
          {usuario.nombre.split(" ")[0]}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-semibold">{usuario.nombre}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{usuario.correo}</span>
          <span className="mt-1.5 w-fit rounded-full bg-secondary-soft px-2 py-0.5 text-[0.6875rem] font-bold text-pino-800">
            {ROL_LABEL[usuario.rol]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {usuario.rol !== "adoptante" && (
          <DropdownMenuItem asChild>
            <Link to={homeForRole(usuario.rol)}>
              <LayoutDashboard aria-hidden="true" />
              Mi panel
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to={paths.cuenta}>
            <UserRound aria-hidden="true" />
            Mi cuenta
          </Link>
        </DropdownMenuItem>
        {usuario.rol === "adoptante" && (
          <>
            <DropdownMenuItem asChild>
              <Link to={paths.adoptante.perfil}>
                <HeartHandshake aria-hidden="true" />
                Perfil de estilo de vida
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={paths.adoptante.solicitudes}>
                <ClipboardList aria-hidden="true" />
                Mis solicitudes
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <Link to={paths.notificaciones}>
            <Bell aria-hidden="true" />
            Notificaciones
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={handleLogout}>
          <LogOut aria-hidden="true" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

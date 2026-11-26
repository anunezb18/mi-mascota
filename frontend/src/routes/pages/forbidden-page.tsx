import { Home, LogIn, ShieldX } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/features/auth/auth-context";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ROL_LABEL } from "@/lib/labels";
import { homeForRole, paths } from "@/routes/paths";

export default function ForbiddenPage() {
  useDocumentTitle("Acceso denegado");
  const { usuario } = useAuth();

  return (
    <section className="container flex justify-center py-16 md:py-24">
      <EmptyState
        tone="secondary"
        icon={ShieldX}
        title="Acceso denegado"
        className="w-full max-w-xl bg-card"
        description={
          usuario ? (
            <>
              Su cuenta tiene el rol <strong className="text-foreground">{ROL_LABEL[usuario.rol]}</strong>, que no
              tiene permisos para ver esta sección. Si cree que se trata de un error, comuníquese con el
              administrador de la plataforma.
            </>
          ) : (
            "Esta sección requiere iniciar sesión con una cuenta autorizada."
          )
        }
        action={
          usuario ? (
            <Button asChild>
              <Link to={homeForRole(usuario.rol)}>
                <Home aria-hidden="true" />
                Ir a mi inicio
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to={paths.ingresar}>
                <LogIn aria-hidden="true" />
                Iniciar sesión
              </Link>
            </Button>
          )
        }
      />
    </section>
  );
}

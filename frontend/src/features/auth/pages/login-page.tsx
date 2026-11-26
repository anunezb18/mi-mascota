import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, FlaskConical, HeartHandshake, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/features/auth/auth-context";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { getErrorMessage } from "@/lib/api-client";
import { env } from "@/lib/env";
import { MOCK_PASSWORD } from "@/mocks/seed/usuarios";
import { paths } from "@/routes/paths";

import { AuthShell } from "../components/auth-shell";
import { type LoginValues, loginSchema } from "../schemas";

const CUENTAS_DEMO = [
  { label: "Adoptante", correo: "adoptante@mimascota.co", icon: HeartHandshake },
  { label: "Fundación", correo: "fundacion@mimascota.co", icon: Building2 },
  { label: "Administrador", correo: "admin@mimascota.co", icon: ShieldCheck },
];

export default function LoginPage() {
  useDocumentTitle("Iniciar sesión");
  const { login } = useAuth();
  const location = useLocation();
  const redirected = Boolean((location.state as { from?: string } | null)?.from);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: "", contrasena: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const usuario = await login(values);
      // GuestOnly redirige automáticamente al destino o al inicio del rol
      toast.success(`Bienvenido(a), ${usuario.nombre.split(" ")[0]}`);
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
    }
  });

  return (
    <AuthShell title="Iniciar sesión" description="Ingrese con el correo y la contraseña de su cuenta.">
      {redirected && (
        <Alert variant="info" className="mb-6">
          Inicie sesión para continuar con la acción que estaba realizando.
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {errors.root && <Alert variant="destructive">{errors.root.message}</Alert>}

        <FormField label="Correo electrónico" error={errors.correo?.message} required>
          <Input type="email" autoComplete="email" placeholder="nombre@correo.com" {...form.register("correo")} />
        </FormField>

        <FormField label="Contraseña" error={errors.contrasena?.message} required>
          <PasswordInput autoComplete="current-password" {...form.register("contrasena")} />
        </FormField>

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-1">
          Ingresar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Aún no tiene cuenta?{" "}
        <Link to={paths.registro} className="font-semibold text-primary underline-offset-4 hover:underline">
          Regístrese aquí
        </Link>
      </p>

      {env.useMock && (
        <div className="mt-8 rounded-2xl border border-dashed border-arena-300 bg-muted/50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <FlaskConical className="size-4 text-secondary" aria-hidden="true" />
            Modo de demostración
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Los datos son simulados. Seleccione una cuenta para completar el formulario (contraseña:{" "}
            <code className="font-semibold text-foreground">{MOCK_PASSWORD}</code>).
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {CUENTAS_DEMO.map(({ label, correo, icon: Icon }) => (
              <Button
                key={correo}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("correo", correo, { shouldValidate: true });
                  form.setValue("contrasena", MOCK_PASSWORD, { shouldValidate: true });
                }}
              >
                <Icon aria-hidden="true" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
}

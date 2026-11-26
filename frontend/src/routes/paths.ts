import type { Rol } from "@/types";

/** Rutas de la aplicación. Úsese siempre esta constante en lugar de cadenas sueltas. */
export const paths = {
  inicio: "/",
  ingresar: "/ingresar",
  registro: "/registro",
  mascotas: "/mascotas",
  mascota: (id: string) => `/mascotas/${id}`,
  adoptante: {
    perfil: "/adoptante/perfil-estilo-vida",
    recomendaciones: "/adoptante/recomendaciones",
    solicitudes: "/adoptante/solicitudes",
  },
  fundacion: {
    panel: "/fundacion",
    mascotas: "/fundacion/mascotas",
    nuevaMascota: "/fundacion/mascotas/nueva",
    editarMascota: (id: string) => `/fundacion/mascotas/${id}/editar`,
    solicitudes: "/fundacion/solicitudes",
  },
  admin: {
    fundaciones: "/admin/fundaciones",
    usuarios: "/admin/usuarios",
  },
  notificaciones: "/notificaciones",
  cuenta: "/cuenta",
  accesoDenegado: "/acceso-denegado",
} as const;

/** Pantalla de inicio de cada rol después de iniciar sesión. */
export function homeForRole(rol: Rol): string {
  switch (rol) {
    case "adoptante":
      return paths.adoptante.recomendaciones;
    case "fundacion":
      return paths.fundacion.panel;
    case "administrador":
      return paths.admin.fundaciones;
  }
}

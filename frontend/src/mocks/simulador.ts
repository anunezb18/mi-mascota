import { db, persist } from "./db";
import { notify } from "./realtime";
import { MOCK_PASSWORD } from "./seed/usuarios";
import { registrarSolicitud } from "./services/solicitudes.mock";
import { objectId } from "./utils";

/**
 * Actividad de "otros usuarios" para demostrar el tiempo real en modo mock, donde
 * solo existe una sesión por navegador. Una vez por sesión y por cuenta, unos
 * segundos después de conectarse:
 * - Fundación aprobada: un adoptante envía una solicitud para una de sus mascotas.
 * - Administrador: una fundación nueva se registra y queda pendiente de validación.
 * Los datos se escriben en la base simulada igual que con las acciones reales.
 */
const ESPERA_MS = 15_000;

const FUNDACIONES_NUEVAS = [
  {
    nombre: "Fundación Patas Felices de Fontibón",
    nit: "901.445.120-8",
    representante: "Carolina Méndez Ruiz",
    correo: "hola@patasfelicesfontibon.org",
    telefono: "3124459087",
    direccion: "Carrera 100 # 22-15",
    localidad: "Fontibón",
    coordenadas: [-74.1436, 4.6735] as [number, number],
    descripcion:
      "Red de hogares de paso para perros rescatados cerca del aeropuerto. Acompañamos cada adopción con seguimiento durante los primeros seis meses.",
  },
  {
    nombre: "Asociación Amigos de Cuatro Patas",
    nit: "900.731.562-4",
    representante: "Héctor Fabián Quintero",
    correo: "contacto@cuatropatasbosa.org",
    telefono: "3008812340",
    direccion: "Calle 59 Sur # 80K-12",
    localidad: "Bosa",
    coordenadas: [-74.1925, 4.6178] as [number, number],
    descripcion:
      "Grupo de voluntarios que rescata perros y gatos en Bosa y Kennedy, con jornadas de vacunación y adopción los fines de semana.",
  },
];

const MENSAJES = [
  "Hola, vi su publicación y me encantaría conocerlo. Tengo tiempo en las tardes y espacio suficiente en casa.",
  "Buenas tardes. Llevo meses buscando un compañero y creo que encajaría muy bien con mi familia.",
];

function yaSimulado(usuarioId: string) {
  const clave = `mimascota.mock.simulado.${usuarioId}`;
  try {
    if (sessionStorage.getItem(clave)) return true;
    sessionStorage.setItem(clave, "1");
  } catch {
    /* sin sessionStorage: se simula igualmente */
  }
  return false;
}

function solicitudParaFundacion(fundacionId: string) {
  const adoptantes = db.usuarios.filter((u) => u.rol === "adoptante" && u.activo && u.perfil_estilo_vida);
  for (const mascota of db.mascotas.filter((m) => m.fundacion_id === fundacionId && m.estado !== "adoptada")) {
    const adoptante = adoptantes.find(
      (a) => !db.solicitudes.some((s) => s.mascota_id === mascota._id && s.adoptante_id === a._id),
    );
    if (adoptante) {
      registrarSolicitud(adoptante, mascota, MENSAJES[Math.floor(Math.random() * MENSAJES.length)]);
      return;
    }
  }
}

function registrarFundacionNueva() {
  const candidata = FUNDACIONES_NUEVAS.find((c) => !db.fundaciones.some((f) => f.nit === c.nit));
  if (!candidata) return;
  const ahora = new Date().toISOString();
  const usuarioId = objectId();
  const fundacionId = objectId();
  db.usuarios.push({
    _id: usuarioId,
    nombre: candidata.representante,
    correo: candidata.correo,
    telefono: candidata.telefono,
    rol: "fundacion",
    activo: true,
    ciudad: "Bogotá",
    fundacion_id: fundacionId,
    fecha_registro: ahora,
    contrasena: MOCK_PASSWORD,
  });
  db.fundaciones.push({
    _id: fundacionId,
    usuario_id: usuarioId,
    nombre: candidata.nombre,
    nit: candidata.nit,
    descripcion: candidata.descripcion,
    direccion: candidata.direccion,
    ciudad: "Bogotá",
    localidad: candidata.localidad,
    telefono: candidata.telefono,
    correo: candidata.correo,
    ubicacion: { type: "Point", coordinates: candidata.coordenadas },
    estado_validacion: "pendiente",
    fecha_registro: ahora,
  });
  persist();
  db.usuarios
    .filter((u) => u.rol === "administrador" && u.activo)
    .forEach((admin) =>
      notify(
        admin._id,
        "fundacion_pendiente",
        "Fundación pendiente de validación",
        `${candidata.nombre} (NIT ${candidata.nit}) se registró y espera la verificación de sus datos.`,
        "/admin/fundaciones",
      ),
    );
}

/** Programa la actividad simulada. Devuelve la función que la cancela. */
export function programarActividadSimulada(usuarioId: string): () => void {
  const usuario = db.usuarios.find((u) => u._id === usuarioId);
  if (!usuario || usuario.rol === "adoptante") return () => undefined;
  if (usuario.rol === "fundacion") {
    const fundacion = db.fundaciones.find((f) => f._id === usuario.fundacion_id);
    if (fundacion?.estado_validacion !== "aprobada") return () => undefined;
  }

  const timer = setTimeout(() => {
    if (yaSimulado(usuarioId)) return;
    if (usuario.rol === "fundacion") solicitudParaFundacion(usuario.fundacion_id!);
    else registrarFundacionNueva();
  }, ESPERA_MS);
  return () => clearTimeout(timer);
}

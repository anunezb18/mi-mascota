import type { CambioEstadoSolicitud, Mascota, Solicitud } from "@/types";

import { daysAgo, objectId } from "../utils";
import { ID, type UsuarioMock } from "./usuarios";

const RECHAZO_AUTOMATICO = "Rechazada automáticamente: se aprobó otra solicitud para esta mascota.";

interface Semilla {
  adoptante: string;
  mascota: string;
  mensaje: string;
  /** Días desde la creación. */
  creada: number;
  historial: { estado: CambioEstadoSolicitud["estado"]; dias: number; nota?: string }[];
}

const SEMILLAS: Semilla[] = [
  /* ----- Laura (cuenta de demostración del adoptante) ----- */
  {
    adoptante: ID.adoptanteLaura,
    mascota: "Kiara",
    creada: 3,
    mensaje:
      "Hola, vivo sola en un apartamento en Chapinero y trabajo desde casa la mayor parte de la semana. Tengo una gata adulta muy tranquila y creo que Kiara se adaptaría bien a nuestro ritmo.",
    historial: [],
  },
  {
    adoptante: ID.adoptanteLaura,
    mascota: "Frida",
    creada: 24,
    mensaje:
      "Me encantaría darle un hogar a Frida. Ya tuve gatos durante diez años y tengo malla de seguridad en todas las ventanas.",
    historial: [{ estado: "aprobada", dias: 18, nota: "Aprobada. Nos comunicaremos para coordinar la visita y la entrega." }],
  },
  {
    adoptante: ID.adoptanteLaura,
    mascota: "Rocco",
    creada: 14,
    mensaje: "Rocco me pareció un perro muy alegre, me gustaría conocerlo y saber si podría vivir conmigo.",
    historial: [
      {
        estado: "rechazada",
        dias: 11,
        nota: "Rocco necesita una casa con patio y no convive con gatos. Le sugerimos revisar a Canela o a Kiara.",
      },
    ],
  },

  /* ----- Otras solicitudes (bandejas de las fundaciones) ----- */
  {
    adoptante: ID.adoptanteValentina,
    mascota: "Frida",
    creada: 22,
    mensaje: "Frida sería mi primera gata. Vivo con mi pareja en un apartamento tranquilo.",
    historial: [{ estado: "rechazada", dias: 18, nota: RECHAZO_AUTOMATICO }],
  },
  {
    adoptante: ID.adoptanteValentina,
    mascota: "Luna",
    creada: 5,
    mensaje:
      "Soy estudiante de posgrado y paso muchas horas en casa. Luna parece ideal para un hogar tranquilo sin niños como el mío.",
    historial: [],
  },
  {
    adoptante: ID.adoptanteCamilo,
    mascota: "Rocco",
    creada: 2,
    mensaje:
      "Tenemos casa con patio grande en Suba y dos hijos de 9 y 12 años que adoran a los perros. Salimos a correr todos los fines de semana.",
    historial: [],
  },
  {
    adoptante: ID.adoptanteJulian,
    mascota: "Thor",
    creada: 1,
    mensaje:
      "Vivo en una finca en La Calera y ya tuve dos huskies. Tengo experiencia con la raza y mucho espacio para que Thor corra.",
    historial: [],
  },
  {
    adoptante: ID.adoptanteCamilo,
    mascota: "Tango",
    creada: 6,
    mensaje: "Tango sería perfecto para jugar con mis hijos en el patio. Podemos ir a conocerlo este sábado.",
    historial: [],
  },
  {
    adoptante: ID.adoptanteJulian,
    mascota: "Tango",
    creada: 4,
    mensaje: "Me interesa Tango como compañero para mi perra, que es muy sociable.",
    historial: [],
  },
  {
    adoptante: ID.adoptanteJulian,
    mascota: "Max",
    creada: 40,
    mensaje: "Busco un perro tranquilo que acompañe a mis papás en la finca.",
    historial: [{ estado: "aprobada", dias: 35, nota: "Aprobada. Entrega realizada." }],
  },
];

/**
 * Construye las solicitudes con las copias resumidas (desnormalizadas) que
 * guarda el documento y ajusta el estado de las mascotas según el resultado.
 */
export function seedSolicitudes(usuarios: UsuarioMock[], mascotas: Mascota[]): Solicitud[] {
  const solicitudes = SEMILLAS.map((s): Solicitud => {
    const adoptante = usuarios.find((u) => u._id === s.adoptante)!;
    const mascota = mascotas.find((m) => m.nombre === s.mascota)!;
    const historial: CambioEstadoSolicitud[] = [
      { estado: "pendiente", fecha: daysAgo(s.creada), nota: "Solicitud enviada por el adoptante." },
      ...s.historial.map((h) => ({ estado: h.estado, fecha: daysAgo(h.dias), nota: h.nota })),
    ];
    const ultimo = historial[historial.length - 1];
    return {
      _id: objectId(),
      mascota_id: mascota._id,
      adoptante_id: adoptante._id,
      fundacion_id: mascota.fundacion_id,
      estado: ultimo.estado,
      mensaje: s.mensaje,
      mascota: { nombre: mascota.nombre, especie: mascota.especie, foto: mascota.fotos[0] },
      fundacion: { nombre: mascota.fundacion.nombre },
      adoptante: {
        nombre: adoptante.nombre,
        correo: adoptante.correo,
        telefono: adoptante.telefono,
        ciudad: adoptante.ciudad,
        perfil_estilo_vida: adoptante.perfil_estilo_vida,
      },
      historial_estados: historial,
      fecha_creacion: historial[0].fecha,
      fecha_actualizacion: ultimo.fecha,
    };
  });

  // Coherencia con la regla de negocio: aprobada => adoptada; pendiente => en proceso
  for (const m of mascotas) {
    const deMascota = solicitudes.filter((s) => s.mascota_id === m._id);
    if (deMascota.some((s) => s.estado === "aprobada")) m.estado = "adoptada";
    else if (deMascota.some((s) => s.estado === "pendiente") && m.estado === "disponible") m.estado = "en_proceso";
  }

  return solicitudes.sort((a, b) => b.fecha_actualizacion.localeCompare(a.fecha_actualizacion));
}

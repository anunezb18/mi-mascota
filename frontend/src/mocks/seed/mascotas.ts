import type {
  AtributosConejo,
  AtributosGato,
  AtributosPerro,
  Fundacion,
  FundacionResumen,
  Mascota,
  RegistroMedico,
  TipoRegistroMedico,
} from "@/types";

import { daysAgo, objectId } from "../utils";
import { ID } from "./usuarios";

/* ---------- Fotos (verificadas) ---------- */
const dog = (path: string) => `https://images.dog.ceo/breeds/${path}`;
const cat = (id: string) => `https://cdn2.thecatapi.com/images/${id}.jpg`;
const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=1000&q=70&auto=format&fit=crop`;

/* ---------- Historial médico ---------- */
const VETERINARIOS = ["Dra. Carolina Méndez", "Dr. Felipe Ospina", "Dra. Ana María Cárdenas", "Dr. Julián Restrepo"];

function registro(dias: number, tipo: TipoRegistroMedico, descripcion: string, vet = 0): RegistroMedico {
  return { _id: objectId(), fecha: daysAgo(dias), tipo, descripcion, veterinario: VETERINARIOS[vet % VETERINARIOS.length] };
}

function historialPerro(base: number, vet: number, esterilizado: boolean, extra: RegistroMedico[] = []) {
  return [
    registro(base, "consulta", "Valoración de ingreso: condición corporal adecuada, sin signos de enfermedad.", vet),
    registro(base - 7, "desparasitacion", "Desparasitación interna (praziquantel y pirantel) y externa.", vet),
    registro(base - 14, "vacuna", "Vacuna múltiple (moquillo, parvovirus, hepatitis, leptospira).", vet + 1),
    registro(base - 30, "vacuna", "Vacuna antirrábica. Próximo refuerzo en un año.", vet + 1),
    ...(esterilizado ? [registro(base - 45, "esterilizacion", "Esterilización sin complicaciones. Retiro de puntos a los 10 días.", vet + 2)] : []),
    ...extra,
  ];
}

function historialGato(base: number, vet: number, esterilizado: boolean, extra: RegistroMedico[] = []) {
  return [
    registro(base, "consulta", "Valoración de ingreso. Prueba de leucemia e inmunodeficiencia felina negativa.", vet),
    registro(base - 5, "desparasitacion", "Desparasitación interna y aplicación de pipeta antipulgas.", vet),
    registro(base - 21, "vacuna", "Vacuna triple felina (rinotraqueítis, calicivirus, panleucopenia).", vet + 1),
    ...(esterilizado ? [registro(base - 40, "esterilizacion", "Esterilización. Recuperación completa.", vet + 2)] : []),
    ...extra,
  ];
}

function historialConejo(base: number, vet: number, esterilizado: boolean) {
  return [
    registro(base, "consulta", "Revisión general: dentadura y pelaje en buen estado.", vet),
    registro(base - 10, "desparasitacion", "Desparasitación interna con ivermectina.", vet),
    registro(base - 25, "vacuna", "Vacuna contra mixomatosis y enfermedad hemorrágica vírica.", vet + 3),
    ...(esterilizado ? [registro(base - 50, "esterilizacion", "Esterilización realizada por veterinario de exóticos.", 3)] : []),
  ];
}

/* ---------- Atributos por especie ---------- */
const perro = (a: AtributosPerro) => a;
const gato = (a: AtributosGato) => a;
const conejo = (a: AtributosConejo) => a;

/** Desplaza ligeramente las coordenadas (hogares de paso cercanos a la sede). */
function cerca([lng, lat]: [number, number], dLng: number, dLat: number): Mascota["ubicacion"] {
  return { type: "Point", coordinates: [Number((lng + dLng).toFixed(5)), Number((lat + dLat).toFixed(5))] };
}

type Base = Omit<Mascota, "_id" | "fundacion" | "fundacion_id" | "ubicacion"> & {
  fundacion: string;
  offset: [number, number];
};

export function seedMascotas(fundaciones: Fundacion[]): Mascota[] {
  const resumen = (id: string): FundacionResumen => {
    const f = fundaciones.find((x) => x._id === id)!;
    return { _id: f._id, nombre: f.nombre, ciudad: f.ciudad, localidad: f.localidad, telefono: f.telefono, correo: f.correo };
  };
  const sede = (id: string) => fundaciones.find((x) => x._id === id)!.ubicacion!.coordinates;

  const datos: Base[] = [
    /* ===== Fundación Huellas de Suba ===== */
    {
      fundacion: ID.fundHuellas,
      offset: [0.004, -0.003],
      nombre: "Canela",
      especie: "perro",
      raza: "Criolla mestiza",
      sexo: "hembra",
      edad_meses: 30,
      tamano: "mediano",
      descripcion:
        "Canela fue rescatada en el humedal La Conejera. Es tranquila dentro de casa, disfruta las caminatas largas y se lleva muy bien con otros perros y con gatos. Conoce las órdenes básicas y camina bien con traílla.",
      temperamento: ["carinoso", "sociable", "jugueton"],
      fotos: [dog("mix/uhie.jpg")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: perro({ nivel_energia: "medio", necesita_patio: false, apto_con_ninos: true, apto_con_gatos: true, entrenado: true }),
      historial_medico: historialPerro(120, 0, true),
      fecha_publicacion: daysAgo(18),
    },
    {
      fundacion: ID.fundHuellas,
      offset: [-0.006, 0.002],
      nombre: "Rocco",
      especie: "perro",
      raza: "Labrador retriever",
      sexo: "macho",
      edad_meses: 48,
      tamano: "grande",
      descripcion:
        "Rocco es un labrador lleno de energía que necesita ejercicio diario y espacio para correr. Ideal para una familia activa con patio. Le encanta nadar y traer la pelota.",
      temperamento: ["sociable", "activo", "jugueton"],
      fotos: [dog("labrador/labrador_zack_01.jpg"), dog("labrador/n02099712_5263.jpg")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: perro({ nivel_energia: "alto", necesita_patio: true, apto_con_ninos: true, apto_con_gatos: false, entrenado: true }),
      historial_medico: historialPerro(200, 1, true, [
        registro(60, "tratamiento", "Tratamiento para otitis externa con gotas óticas durante 10 días. Resuelta.", 1),
      ]),
      fecha_publicacion: daysAgo(35),
    },
    {
      fundacion: ID.fundHuellas,
      offset: [0.002, 0.005],
      nombre: "Mostaza",
      especie: "gato",
      raza: "Común europeo atigrado",
      sexo: "macho",
      edad_meses: 6,
      tamano: "pequeno",
      descripcion:
        "Mostaza llegó con sus hermanos a las seis semanas. Es curioso, juguetón y busca compañía todo el tiempo. Ya usa arenero y está acostumbrado al ruido de un hogar.",
      temperamento: ["jugueton", "carinoso", "activo"],
      fotos: [cat("6s7")],
      estado: "disponible",
      esterilizado: false,
      atributos_especie: gato({ usa_arenero: true, apto_con_perros: true, apto_con_ninos: true, solo_interior: true }),
      historial_medico: historialGato(60, 2, false),
      fecha_publicacion: daysAgo(6),
    },
    {
      fundacion: ID.fundHuellas,
      offset: [-0.003, -0.006],
      nombre: "Luna",
      especie: "gato",
      raza: "Común europeo",
      sexo: "hembra",
      edad_meses: 24,
      tamano: "pequeno",
      descripcion:
        "Luna es independiente y observadora. Prefiere hogares tranquilos, sin niños pequeños, donde pueda tener su propio espacio. Cuando toma confianza busca caricias.",
      temperamento: ["tranquilo", "independiente"],
      fotos: [unsplash("photo-1495360010541-f48722b34f7d")],
      estado: "en_proceso",
      esterilizado: true,
      atributos_especie: gato({ usa_arenero: true, apto_con_perros: false, apto_con_ninos: false, solo_interior: true }),
      historial_medico: historialGato(150, 0, true),
      fecha_publicacion: daysAgo(40),
    },
    {
      fundacion: ID.fundHuellas,
      offset: [0.007, 0.001],
      nombre: "Copito",
      especie: "conejo",
      raza: "Mestizo",
      sexo: "macho",
      edad_meses: 10,
      tamano: "pequeno",
      descripcion:
        "Copito es tímido al principio, pero con paciencia se deja cargar y acariciar. Necesita un espacio amplio para moverse fuera de la jaula varias horas al día.",
      temperamento: ["tranquilo", "timido"],
      fotos: [unsplash("photo-1585110396000-c9ffd4e4b308"), unsplash("photo-1559214369-a6b1d7919865")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: conejo({ usa_arenero: true, tipo_pelaje: "corto", apto_con_ninos: true, requiere_jaula_amplia: true }),
      historial_medico: historialConejo(90, 1, true),
      fecha_publicacion: daysAgo(12),
    },
    {
      fundacion: ID.fundHuellas,
      offset: [-0.008, 0.006],
      nombre: "Thor",
      especie: "perro",
      raza: "Husky siberiano",
      sexo: "macho",
      edad_meses: 60,
      tamano: "grande",
      descripcion:
        "Thor fue entregado por su familia anterior por falta de espacio. Es noble pero muy activo e independiente: requiere una persona con experiencia en la raza, paseos largos y un hogar con patio.",
      temperamento: ["activo", "independiente"],
      fotos: [dog("husky/n02110185_3328.jpg"), dog("husky/n02110185_10175.jpg")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: perro({ nivel_energia: "alto", necesita_patio: true, apto_con_ninos: true, apto_con_gatos: false, entrenado: false }),
      historial_medico: historialPerro(180, 2, true),
      fecha_publicacion: daysAgo(50),
    },

    /* ===== Refugio Patitas de Chapinero ===== */
    {
      fundacion: ID.fundPatitas,
      offset: [0.003, 0.002],
      nombre: "Pelusa",
      especie: "gato",
      raza: "Sphynx",
      sexo: "hembra",
      edad_meses: 36,
      tamano: "pequeno",
      descripcion:
        "Pelusa fue rescatada de un criadero ilegal. Al no tener pelo necesita baños periódicos y un hogar cálido. Es extremadamente cariñosa y sigue a su persona por toda la casa.",
      temperamento: ["carinoso", "sociable"],
      fotos: [cat("c9sGDkRoi")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: gato({ usa_arenero: true, apto_con_perros: true, apto_con_ninos: true, solo_interior: true }),
      historial_medico: historialGato(110, 3, true, [
        registro(30, "consulta", "Control dermatológico: piel en buen estado. Se recomienda hidratación semanal.", 3),
      ]),
      fecha_publicacion: daysAgo(9),
    },
    {
      fundacion: ID.fundPatitas,
      offset: [-0.004, 0.004],
      nombre: "Simón",
      especie: "gato",
      raza: "Común europeo bicolor",
      sexo: "macho",
      edad_meses: 18,
      tamano: "pequeno",
      descripcion:
        "Simón es sociable y juguetón. Convive en su hogar de paso con dos perros pequeños y un niño de ocho años. Le gustan las ventanas y los juguetes de plumas.",
      temperamento: ["sociable", "jugueton"],
      fotos: [unsplash("photo-1514888286974-6c03e2ca1dba")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: gato({ usa_arenero: true, apto_con_perros: true, apto_con_ninos: true, solo_interior: true }),
      historial_medico: historialGato(80, 0, true),
      fecha_publicacion: daysAgo(15),
    },
    {
      fundacion: ID.fundPatitas,
      offset: [0.005, -0.004],
      nombre: "Kiara",
      especie: "perro",
      raza: "Dachshund",
      sexo: "hembra",
      edad_meses: 54,
      tamano: "pequeno",
      descripcion:
        "Kiara es una salchicha tranquila y muy apegada. Ideal para apartamento. Por su raza se debe cuidar que no suba ni baje escaleras con frecuencia.",
      temperamento: ["carinoso", "tranquilo"],
      fotos: [dog("dachshund/reese.jpg")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: perro({ nivel_energia: "bajo", necesita_patio: false, apto_con_ninos: true, apto_con_gatos: true, entrenado: true }),
      historial_medico: historialPerro(140, 3, true, [
        registro(45, "consulta", "Radiografía de columna sin hallazgos. Mantener peso controlado.", 3),
      ]),
      fecha_publicacion: daysAgo(22),
    },
    {
      fundacion: ID.fundPatitas,
      offset: [-0.002, -0.005],
      nombre: "Nube",
      especie: "conejo",
      raza: "Belier",
      sexo: "hembra",
      edad_meses: 14,
      tamano: "pequeno",
      descripcion:
        "Nube es una coneja belier muy dócil, acostumbrada a convivir con personas. Come heno, verduras frescas y pellets. Usa arenero sin problema.",
      temperamento: ["carinoso", "tranquilo"],
      fotos: [unsplash("photo-1591382386627-349b692688ff"), unsplash("photo-1452857297128-d9c29adba80b")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: conejo({ usa_arenero: true, tipo_pelaje: "largo", apto_con_ninos: true, requiere_jaula_amplia: true }),
      historial_medico: historialConejo(100, 2, true),
      fecha_publicacion: daysAgo(4),
    },
    {
      fundacion: ID.fundPatitas,
      offset: [0.001, 0.006],
      nombre: "Mango",
      especie: "gato",
      raza: "Mestizo",
      sexo: "macho",
      edad_meses: 4,
      tamano: "pequeno",
      descripcion:
        "Mango es un gatito de cuatro meses, activo y dormilón a partes iguales. Recomendamos adoptarlo junto con otro gato joven o en un hogar donde tenga compañía.",
      temperamento: ["jugueton", "activo"],
      fotos: [cat("ck2")],
      estado: "disponible",
      esterilizado: false,
      atributos_especie: gato({ usa_arenero: true, apto_con_perros: true, apto_con_ninos: true, solo_interior: true }),
      historial_medico: historialGato(50, 1, false),
      fecha_publicacion: daysAgo(2),
    },
    {
      fundacion: ID.fundPatitas,
      offset: [-0.005, -0.001],
      nombre: "Frida",
      especie: "gato",
      raza: "Común europeo",
      sexo: "hembra",
      edad_meses: 30,
      tamano: "pequeno",
      descripcion: "Frida encontró hogar con una familia en Chapinero Alto. Gracias por ayudarnos a difundir su caso.",
      temperamento: ["sociable", "jugueton", "carinoso"],
      fotos: [unsplash("photo-1543852786-1cf6624b9987")],
      estado: "adoptada",
      esterilizado: true,
      atributos_especie: gato({ usa_arenero: true, apto_con_perros: true, apto_con_ninos: true, solo_interior: false }),
      historial_medico: historialGato(160, 2, true),
      fecha_publicacion: daysAgo(70),
    },

    /* ===== Fundación Hogar Peludo (Kennedy) ===== */
    {
      fundacion: ID.fundHogarPeludo,
      offset: [0.003, 0.004],
      nombre: "Negra",
      especie: "perro",
      raza: "Criolla mestiza",
      sexo: "hembra",
      edad_meses: 40,
      tamano: "mediano",
      descripcion:
        "Negra es leal y protectora con su familia. En el albergue es la más tranquila del patio. Se recomienda presentarla con calma a otros perros.",
      temperamento: ["protector", "carinoso", "tranquilo"],
      fotos: [dog("pitbull/siena-123.jpg")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: perro({ nivel_energia: "medio", necesita_patio: false, apto_con_ninos: true, apto_con_gatos: false, entrenado: true }),
      historial_medico: historialPerro(160, 0, true),
      fecha_publicacion: daysAgo(28),
    },
    {
      fundacion: ID.fundHogarPeludo,
      offset: [-0.004, 0.002],
      nombre: "Bruno",
      especie: "perro",
      raza: "American pitbull terrier",
      sexo: "macho",
      edad_meses: 36,
      tamano: "grande",
      descripcion:
        "Bruno es un perro sociable y juguetón con las personas. Necesita un adoptante con experiencia, paseos diarios y cumplir la normativa de razas de manejo especial (Ley 1801 de 2016).",
      temperamento: ["protector", "sociable", "activo"],
      fotos: [dog("pitbull/dog-5437227_640.jpg")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: perro({ nivel_energia: "alto", necesita_patio: true, apto_con_ninos: false, apto_con_gatos: false, entrenado: true }),
      historial_medico: historialPerro(130, 1, true),
      fecha_publicacion: daysAgo(31),
    },
    {
      fundacion: ID.fundHogarPeludo,
      offset: [0.006, -0.002],
      nombre: "Pecas",
      especie: "perro",
      raza: "Beagle",
      sexo: "macho",
      edad_meses: 20,
      tamano: "mediano",
      descripcion:
        "Pecas es un beagle alegre y curioso. Le encanta olfatear todo durante los paseos y jugar con niños. Puede ser vocal cuando se queda solo mucho tiempo.",
      temperamento: ["jugueton", "activo", "sociable"],
      fotos: [dog("beagle/homer.jpg"), dog("beagle/n02088364_16502.jpg")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: perro({ nivel_energia: "alto", necesita_patio: false, apto_con_ninos: true, apto_con_gatos: true, entrenado: false }),
      historial_medico: historialPerro(90, 2, true),
      fecha_publicacion: daysAgo(10),
    },
    {
      fundacion: ID.fundHogarPeludo,
      offset: [-0.002, -0.005],
      nombre: "Tango",
      especie: "perro",
      raza: "Mestizo pastor",
      sexo: "macho",
      edad_meses: 16,
      tamano: "mediano",
      descripcion:
        "Tango es inteligente y aprende rápido. Necesita estimulación mental y juego diario con pelota. Convive bien con otros perros.",
      temperamento: ["activo", "jugueton"],
      fotos: [dog("mix/xeshabelka_%2835%29.jpg")],
      estado: "en_proceso",
      esterilizado: true,
      atributos_especie: perro({ nivel_energia: "alto", necesita_patio: true, apto_con_ninos: true, apto_con_gatos: true, entrenado: true }),
      historial_medico: historialPerro(70, 3, true),
      fecha_publicacion: daysAgo(20),
    },
    {
      fundacion: ID.fundHogarPeludo,
      offset: [0.001, -0.007],
      nombre: "Oreo",
      especie: "conejo",
      raza: "Holandés",
      sexo: "macho",
      edad_meses: 8,
      tamano: "pequeno",
      descripcion: "Oreo es un conejo activo y sociable que disfruta explorar. Se lleva bien con niños mayores que sepan cargarlo.",
      temperamento: ["activo", "sociable"],
      fotos: [unsplash("photo-1518796745738-41048802f99a")],
      estado: "disponible",
      esterilizado: false,
      atributos_especie: conejo({ usa_arenero: false, tipo_pelaje: "corto", apto_con_ninos: true, requiere_jaula_amplia: true }),
      historial_medico: historialConejo(60, 0, false),
      fecha_publicacion: daysAgo(7),
    },
    {
      fundacion: ID.fundHogarPeludo,
      offset: [-0.006, -0.003],
      nombre: "Kala",
      especie: "gato",
      raza: "Bengalí mestiza",
      sexo: "hembra",
      edad_meses: 12,
      tamano: "pequeno",
      descripcion:
        "Kala es muy activa, le gusta trepar y explorar. Necesita rascadores, juego diario y ventanas con malla de seguridad.",
      temperamento: ["activo", "independiente"],
      fotos: [cat("4-5SzDNIL")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: gato({ usa_arenero: true, apto_con_perros: false, apto_con_ninos: true, solo_interior: true }),
      historial_medico: historialGato(75, 3, true),
      fecha_publicacion: daysAgo(14),
    },

    /* ===== Albergue Segunda Oportunidad (Usaquén) ===== */
    {
      fundacion: ID.fundSegunda,
      offset: [0.003, -0.002],
      nombre: "Toño",
      especie: "perro",
      raza: "Mestizo",
      sexo: "macho",
      edad_meses: 132,
      tamano: "mediano",
      descripcion:
        "Toño tiene once años y una calma contagiosa. Busca un hogar donde pasar su vejez con paseos cortos, una cama cómoda y mucha compañía.",
      temperamento: ["tranquilo", "carinoso"],
      fotos: [dog("mix/floki-the-chilean-mutt-8.jpg")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: perro({ nivel_energia: "bajo", necesita_patio: false, apto_con_ninos: true, apto_con_gatos: true, entrenado: true }),
      historial_medico: historialPerro(220, 0, true, [
        registro(40, "tratamiento", "Suplemento articular (glucosamina) de uso diario por artrosis leve.", 0),
        registro(20, "consulta", "Control geriátrico: exámenes de sangre dentro de parámetros normales.", 0),
      ]),
      fecha_publicacion: daysAgo(45),
    },
    {
      fundacion: ID.fundSegunda,
      offset: [-0.003, 0.003],
      nombre: "Dalí",
      especie: "gato",
      raza: "Devon rex",
      sexo: "macho",
      edad_meses: 108,
      tamano: "pequeno",
      descripcion:
        "Dalí es un gato senior tranquilo que disfruta dormir al sol. Fue entregado cuando su tutora se mudó al exterior. Se adapta bien a apartamentos.",
      temperamento: ["tranquilo", "independiente"],
      fotos: [cat("5mg")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: gato({ usa_arenero: true, apto_con_perros: false, apto_con_ninos: true, solo_interior: true }),
      historial_medico: historialGato(190, 1, true, [
        registro(25, "cirugia", "Limpieza dental con extracción de dos piezas. Recuperación favorable.", 1),
      ]),
      fecha_publicacion: daysAgo(26),
    },
    {
      fundacion: ID.fundSegunda,
      offset: [0.005, 0.004],
      nombre: "Rita",
      especie: "perro",
      raza: "Poodle toy",
      sexo: "hembra",
      edad_meses: 108,
      tamano: "pequeno",
      descripcion:
        "Rita es tímida con desconocidos, pero muy cariñosa cuando entra en confianza. Ideal para una persona adulta o una pareja que pase tiempo en casa.",
      temperamento: ["carinoso", "timido"],
      fotos: [dog("poodle-toy/n02113624_2521.jpg")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: perro({ nivel_energia: "bajo", necesita_patio: false, apto_con_ninos: false, apto_con_gatos: true, entrenado: true }),
      historial_medico: historialPerro(170, 2, true),
      fecha_publicacion: daysAgo(33),
    },
    {
      fundacion: ID.fundSegunda,
      offset: [-0.005, -0.004],
      nombre: "Canelo",
      especie: "conejo",
      raza: "Belier",
      sexo: "macho",
      edad_meses: 72,
      tamano: "pequeno",
      descripcion: "Canelo es un conejo adulto muy calmado. Disfruta las siestas largas y las hojas de cilantro.",
      temperamento: ["tranquilo"],
      fotos: [unsplash("photo-1535241749838-299277b6305f")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: conejo({ usa_arenero: true, tipo_pelaje: "corto", apto_con_ninos: true, requiere_jaula_amplia: false }),
      historial_medico: historialConejo(130, 3, true),
      fecha_publicacion: daysAgo(38),
    },
    {
      fundacion: ID.fundSegunda,
      offset: [0.002, 0.006],
      nombre: "Greta",
      especie: "gato",
      raza: "Común europeo atigrado",
      sexo: "hembra",
      edad_meses: 120,
      tamano: "pequeno",
      descripcion:
        "Greta tiene diez años, es cariñosa y muy limpia. Busca un hogar tranquilo donde la dejen dormir en el sofá.",
      temperamento: ["tranquilo", "carinoso"],
      fotos: [cat("3mo")],
      estado: "disponible",
      esterilizado: true,
      atributos_especie: gato({ usa_arenero: true, apto_con_perros: true, apto_con_ninos: true, solo_interior: true }),
      historial_medico: historialGato(210, 0, true),
      fecha_publicacion: daysAgo(52),
    },
    {
      fundacion: ID.fundSegunda,
      offset: [-0.001, -0.006],
      nombre: "Max",
      especie: "perro",
      raza: "Golden retriever",
      sexo: "macho",
      edad_meses: 96,
      tamano: "grande",
      descripcion: "Max ya está en su nuevo hogar en Cedritos. ¡Gracias a la familia que le dio una segunda oportunidad!",
      temperamento: ["tranquilo", "sociable", "carinoso"],
      fotos: [dog("retriever-golden/n02099601_124.jpg")],
      estado: "adoptada",
      esterilizado: true,
      atributos_especie: perro({ nivel_energia: "medio", necesita_patio: true, apto_con_ninos: true, apto_con_gatos: true, entrenado: true }),
      historial_medico: historialPerro(240, 1, true),
      fecha_publicacion: daysAgo(90),
    },
  ];

  return datos.map(({ fundacion, offset, ...m }, index) => ({
    ...m,
    // Identificadores estables para que los enlaces de demostración no cambien
    _id: `6741c3f0e4d3c3${String(index + 1).padStart(10, "0")}`,
    fundacion_id: fundacion,
    fundacion: resumen(fundacion),
    ubicacion: cerca(sede(fundacion), offset[0], offset[1]),
    historial_medico: [...m.historial_medico].sort((a, b) => b.fecha.localeCompare(a.fecha)),
  }));
}

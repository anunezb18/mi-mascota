import { formatDistance } from "@/lib/format";
import { ESPECIE_LABEL, TAMANO_LABEL, TIPO_VIVIENDA_LABEL } from "@/lib/labels";
import type {
  AtributosConejo,
  AtributosGato,
  AtributosPerro,
  Mascota,
  PerfilEstiloVida,
  Recomendacion,
} from "@/types";

/**
 * Algoritmo de compatibilidad usado por el modo mock. El backend debe
 * replicarlo (o mejorarlo) en GET /recomendaciones. Suma hasta 100 puntos:
 *
 *  Criterio                      Máx.  Regla
 *  Especie preferida ............ 20   20 si coincide; 12 si no hay preferencia; 0 si no coincide
 *  Espacio de la vivienda ....... 20   según tamaño, necesidad de patio y tipo de vivienda
 *  Tiempo disponible ............ 15   15 si sobra ≥ 2 h, 12 si sobra 1 h, 9 si es justo; proporcional si falta
 *  Tamaño preferido ............. 10   10 si coincide; 6 si no hay preferencia; 0 si no coincide
 *  Convivencia con niños ........ 10   10 sin niños o si es apto; 0 si no es apto
 *  Convivencia con mascotas ..... 10   10 sin mascotas o si es compatible; 0 si no
 *  Cercanía ..................... 10   ≤3 km 10, ≤8 km 7, ≤15 km 4, más lejos 2; 6 sin ubicación
 *  Experiencia .................. 5    5 con experiencia; 3 sin experiencia si la mascota no es exigente; 0 si lo es
 *
 * Las razones son las frases de los criterios con puntaje alto, ordenadas por
 * aporte; se devuelven como máximo tres.
 */

/** Horas diarias que requiere cada mascota según especie y energía. */
function horasNecesarias(m: Mascota): number {
  if (m.especie === "perro") {
    return { bajo: 2, medio: 3, alto: 5 }[(m.atributos_especie as AtributosPerro).nivel_energia];
  }
  if (m.especie === "gato") return m.temperamento.includes("activo") ? 3 : 2;
  return 2;
}

function puntajeEspacio(m: Mascota, p: PerfilEstiloVida): number {
  const amplio = p.tipo_vivienda !== "apartamento";
  if (m.especie === "perro") {
    const a = m.atributos_especie as AtributosPerro;
    if (a.necesita_patio && !p.tiene_patio) return 0;
    if (amplio || p.tiene_patio) return 20;
    return { pequeno: 20, mediano: 15, grande: 6 }[m.tamano];
  }
  if (m.especie === "conejo") {
    return (m.atributos_especie as AtributosConejo).requiere_jaula_amplia && !amplio ? 13 : 20;
  }
  return m.temperamento.includes("activo") && !amplio ? 16 : 20;
}

function puntajeTiempo(horas: number, necesarias: number): number {
  const margen = horas - necesarias;
  if (margen >= 2) return 15;
  if (margen >= 1) return 12;
  if (margen >= 0) return 9;
  return Math.round((horas / necesarias) * 9);
}

function puntajeCercania(km: number | undefined): number {
  if (km === undefined) return 6;
  if (km <= 3) return 10;
  if (km <= 8) return 7;
  if (km <= 15) return 4;
  return 2;
}

export function calcularCompatibilidad(m: Mascota, p: PerfilEstiloVida): Recomendacion {
  const razones: { peso: number; texto: string }[] = [];
  let total = 0;
  const sumar = (puntos: number, texto?: string, minimoRazon = 0) => {
    total += puntos;
    if (texto && puntos >= minimoRazon && puntos > 0) razones.push({ peso: puntos, texto });
  };

  const especie = ESPECIE_LABEL[m.especie].toLowerCase();
  const vivienda = TIPO_VIVIENDA_LABEL[p.tipo_vivienda].toLowerCase();

  // Especie
  if (p.especies_preferidas.length === 0) sumar(12);
  else if (p.especies_preferidas.includes(m.especie)) sumar(20, `Es un ${especie}, una de las especies que prefiere.`);

  // Espacio
  const espacio = puntajeEspacio(m, p);
  const necesitaPatio = m.especie === "perro" && (m.atributos_especie as AtributosPerro).necesita_patio;
  sumar(espacio, necesitaPatio ? "Necesita patio y su hogar cuenta con uno." : `Se adapta bien a vivir en ${vivienda}.`, 20);

  // Tiempo disponible frente a la energía de la mascota
  const necesarias = horasNecesarias(m);
  sumar(
    puntajeTiempo(p.horas_disponibles, necesarias),
    `Sus ${p.horas_disponibles} h diarias cubren el tiempo que necesita (unas ${necesarias} h).`,
    12,
  );

  // Tamaño
  if (p.tamanos_preferidos.length === 0) sumar(6);
  else if (p.tamanos_preferidos.includes(m.tamano))
    sumar(10, `Su tamaño (${TAMANO_LABEL[m.tamano].toLowerCase()}) coincide con lo que busca.`);

  // Niños
  const aptoNinos = (m.atributos_especie as { apto_con_ninos: boolean }).apto_con_ninos;
  if (!p.tiene_ninos) sumar(10);
  else if (aptoNinos) sumar(10, "Convive bien con niños.");

  // Otras mascotas
  if (!p.tiene_otras_mascotas || p.otras_mascotas.length === 0) sumar(10);
  else {
    const compatible = p.otras_mascotas.every((otra) => {
      if (m.especie === "perro" && otra === "gato") return (m.atributos_especie as AtributosPerro).apto_con_gatos;
      if (m.especie === "gato" && otra === "perro") return (m.atributos_especie as AtributosGato).apto_con_perros;
      if (m.especie === "conejo" && otra === "perro") return false;
      return m.temperamento.includes("sociable") || m.temperamento.includes("tranquilo");
    });
    if (compatible) sumar(10, "Puede convivir con las mascotas que ya tiene.");
  }

  // Cercanía
  sumar(
    puntajeCercania(m.distancia_km),
    m.distancia_km !== undefined ? `Está a solo ${formatDistance(m.distancia_km)} de usted.` : undefined,
    10,
  );

  // Experiencia
  const exigente =
    m.temperamento.includes("independiente") ||
    m.temperamento.includes("protector") ||
    (m.especie === "perro" && (m.atributos_especie as AtributosPerro).nivel_energia === "alto");
  if (p.experiencia_previa) sumar(5, exigente ? "Su experiencia previa le ayudará con su temperamento." : undefined);
  else if (!exigente) sumar(3);

  return {
    mascota: m,
    compatibilidad: Math.min(100, total),
    razones: razones
      .sort((a, b) => b.peso - a.peso)
      .slice(0, 3)
      .map((r) => r.texto),
  };
}

import type { Mascota } from "./mascota";

export interface Recomendacion {
  mascota: Mascota;
  /** Porcentaje de compatibilidad entre 0 y 100. */
  compatibilidad: number;
  /** Explicaciones cortas de por qué se recomienda. */
  razones: string[];
}

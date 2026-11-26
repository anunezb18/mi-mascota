import { Check, Minus } from "lucide-react";

import { ATRIBUTO_ESPECIE_LABEL, NIVEL_ENERGIA_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { AtributosEspecie } from "@/types";

const VALOR_LABEL: Record<string, string> = {
  ...NIVEL_ENERGIA_LABEL,
  corto: "Corto",
  largo: "Largo",
};

/** Atributos variables por especie (`atributos_especie`): se muestran según las claves que traiga el documento. */
export function SpeciesAttributes({ atributos }: { atributos: AtributosEspecie }) {
  const entries = Object.entries(atributos) as [string, boolean | string][];

  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {entries.map(([clave, valor]) => {
        const label = ATRIBUTO_ESPECIE_LABEL[clave] ?? clave.replace(/_/g, " ");
        const isBool = typeof valor === "boolean";
        return (
          <div key={clave} className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
            <dt className="text-sm text-arena-700">{label}</dt>
            <dd className="flex items-center gap-1.5 text-sm font-semibold">
              {isBool ? (
                <>
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full",
                      valor ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {valor ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : <Minus className="size-3.5" aria-hidden="true" />}
                  </span>
                  {valor ? "Sí" : "No"}
                </>
              ) : (
                (VALOR_LABEL[valor] ?? valor)
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

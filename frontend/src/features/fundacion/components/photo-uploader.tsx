import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { useSubirFoto } from "../hooks";

const MAX_FOTOS = 6;

interface PhotoUploaderProps {
  value: string[];
  onChange: (fotos: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
}

/**
 * Carga de fotos con vista previa. La primera es la portada que se muestra en el
 * catálogo. Se suben de inmediato al servidor y el formulario guarda las URLs.
 */
export function PhotoUploader({ value, onChange, invalid, describedBy }: PhotoUploaderProps) {
  const subir = useSubirFoto();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = React.useState(0);
  const [arrastrando, setArrastrando] = React.useState(false);
  const fotosRef = React.useRef(value);
  fotosRef.current = value;

  const disponibles = MAX_FOTOS - value.length;

  const procesar = async (archivos: File[]) => {
    const lote = archivos.filter((a) => a.type.startsWith("image/")).slice(0, disponibles);
    if (archivos.length > lote.length) {
      toast.warning("Algunos archivos no se agregaron", {
        description: `Solo se admiten imágenes y un máximo de ${MAX_FOTOS} fotos.`,
      });
    }
    for (const archivo of lote) {
      setSubiendo((n) => n + 1);
      try {
        const { url } = await subir.mutateAsync(archivo);
        onChange([...fotosRef.current, url]);
      } catch (error) {
        toast.error(`No se pudo subir «${archivo.name}»`, { description: getErrorMessage(error) });
      } finally {
        setSubiendo((n) => n - 1);
      }
    }
  };

  const quitar = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const hacerPortada = (i: number) => onChange([value[i], ...value.filter((_, idx) => idx !== i)]);

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-describedby={describedBy}>
        {value.map((src, i) => (
          <li key={src.slice(0, 64) + i} className="group relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
            <img src={src} alt={`Foto ${i + 1}${i === 0 ? " (portada)" : ""}`} className="size-full object-cover" />
            {i === 0 && (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-bold text-primary-foreground shadow-soft">
                <Star className="size-3 fill-current" aria-hidden="true" />
                Portada
              </span>
            )}
            <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => hacerPortada(i)}
                  className="grid size-8 place-items-center rounded-full bg-card/95 shadow-soft backdrop-blur transition-colors hover:bg-card"
                  aria-label={`Usar la foto ${i + 1} como portada`}
                >
                  <Star className="size-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => quitar(i)}
                className="grid size-8 place-items-center rounded-full bg-card/95 text-destructive shadow-soft backdrop-blur transition-colors hover:bg-destructive-soft"
                aria-label={`Quitar la foto ${i + 1}`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}

        {Array.from({ length: subiendo }, (_, i) => (
          <li key={`subiendo-${i}`} className="grid aspect-[4/3] place-items-center rounded-xl border bg-muted" role="status">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Subiendo foto…</span>
          </li>
        ))}

        {disponibles - subiendo > 0 && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                void procesar(Array.from(e.dataTransfer.files));
              }}
              className={cn(
                "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-center text-sm transition-colors",
                arrastrando ? "border-primary bg-primary-soft/50" : "border-arena-300 hover:border-primary hover:bg-primary-soft/30",
                invalid && "border-destructive",
              )}
            >
              <ImagePlus className="size-6 text-primary" aria-hidden="true" />
              <span className="font-semibold">Agregar fotos</span>
              <span className="text-xs text-muted-foreground">Arrastre o haga clic · quedan {disponibles}</span>
            </button>
          </li>
        )}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          void procesar(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}

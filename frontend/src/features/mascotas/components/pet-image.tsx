import { Cat, Dog, Rabbit } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import type { Especie } from "@/types";

export const ESPECIE_ICON = { perro: Dog, gato: Cat, conejo: Rabbit } as const;

interface PetImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  especie: Especie;
}

/**
 * Foto de mascota con carga diferida, aparición suave y un respaldo ilustrado
 * si la imagen no está disponible.
 */
export function PetImage({ src, alt, especie, className, ...props }: PetImageProps) {
  // El estado se asocia a la URL concreta: si cambia `src` vuelve a "cargando" sin
  // necesidad de un efecto (que podía pisar un onLoad ya disparado).
  const [loadedSrc, setLoadedSrc] = React.useState<string | null>(null);
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const status = !src || failedSrc === src ? "error" : loadedSrc === src ? "loaded" : "loading";
  const Icon = ESPECIE_ICON[especie];

  if (status === "error") {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("grid size-full place-items-center bg-gradient-to-br from-terracota-100 to-arena-200", className)}
      >
        <Icon className="size-1/4 max-h-16 max-w-16 text-terracota-400" strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoadedSrc(src ?? null)}
      onError={() => setFailedSrc(src ?? null)}
      className={cn(
        "size-full bg-arena-200 object-cover transition-opacity duration-500",
        status === "loaded" ? "opacity-100" : "opacity-0",
        className,
      )}
      {...props}
    />
  );
}

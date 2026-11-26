import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import type { Mascota } from "@/types";

import { PetImage } from "./pet-image";

/** Galería con foto principal, miniaturas y navegación con flechas del teclado. */
export function PetGallery({ mascota }: { mascota: Mascota }) {
  const fotos = mascota.fotos.length ? mascota.fotos : [""];
  const [index, setIndex] = React.useState(0);
  const total = fotos.length;
  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (total < 2) return;
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  return (
    <div className="flex flex-col gap-3" onKeyDown={onKeyDown} aria-roledescription="galería" aria-label={`Fotos de ${mascota.nombre}`}>
      <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-arena-200 shadow-card">
        {fotos.map((src, i) => (
          <div
            key={src + i}
            aria-hidden={i !== index}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-gentle",
              i === index ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <PetImage
              src={src || undefined}
              alt={`${mascota.nombre}, foto ${i + 1} de ${total}`}
              especie={mascota.especie}
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}

        {total > 1 && (
          <>
            <GalleryArrow side="left" onClick={() => go(-1)} />
            <GalleryArrow side="right" onClick={() => go(1)} />
            <span className="absolute bottom-3 right-3 rounded-full bg-arena-900/70 px-2.5 py-1 text-xs font-semibold text-white" aria-live="polite">
              {index + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Miniaturas">
          {fotos.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${total}`}
              aria-current={i === index || undefined}
              className={cn(
                "relative size-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <PetImage src={src} alt="" especie={mascota.especie} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Foto anterior" : "Foto siguiente"}
      className={cn(
        "absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-card/90 shadow-card backdrop-blur transition-all hover:bg-card",
        "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}

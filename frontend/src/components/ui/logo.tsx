import { cn } from "@/lib/utils";

/**
 * Marca de MiMascota: una placa de identificación (como las que llevan los
 * collares) con una huella. Representa "pertenecer a un hogar".
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden="true">
      {/* Argolla de la placa */}
      <circle cx="20" cy="5.5" r="3.2" fill="none" stroke="#28655B" strokeWidth="2.2" />
      {/* Placa */}
      <path
        d="M20 8.5c7.6 0 14 5.6 14 13.3 0 8.2-6.4 15.2-14 15.2S6 30 6 21.8C6 14.1 12.4 8.5 20 8.5Z"
        fill="#B9461D"
      />
      <path
        d="M20 8.5c7.6 0 14 5.6 14 13.3 0 2-.4 3.9-1.1 5.6C29.7 20 24.6 15 18 13.4c-3.4-.8-6.6-.4-9.4.8C11 10.8 15.2 8.5 20 8.5Z"
        fill="#D65C2C"
      />
      {/* Huella */}
      <g fill="#FBF8F4">
        <ellipse cx="20" cy="26.4" rx="4.6" ry="3.9" />
        <ellipse cx="13.9" cy="21.2" rx="1.9" ry="2.3" transform="rotate(-18 13.9 21.2)" />
        <ellipse cx="17.6" cy="17.9" rx="1.9" ry="2.4" transform="rotate(-6 17.6 17.9)" />
        <ellipse cx="22.4" cy="17.9" rx="1.9" ry="2.4" transform="rotate(6 22.4 17.9)" />
        <ellipse cx="26.1" cy="21.2" rx="1.9" ry="2.3" transform="rotate(18 26.1 21.2)" />
      </g>
    </svg>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span
        className={cn(
          "font-display text-[1.35rem] font-semibold tracking-tight",
          inverted ? "text-arena-50" : "text-foreground",
        )}
      >
        <span className={inverted ? "text-terracota-300" : "text-primary"}>Mi</span>Mascota
      </span>
    </span>
  );
}

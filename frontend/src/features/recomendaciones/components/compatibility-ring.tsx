import { cn } from "@/lib/utils";

export function nivelCompatibilidad(valor: number) {
  if (valor >= 80) return { label: "Compatibilidad alta", stroke: "stroke-success", text: "text-success" };
  if (valor >= 65) return { label: "Compatibilidad buena", stroke: "stroke-secondary", text: "text-secondary" };
  return { label: "Compatibilidad moderada", stroke: "stroke-warning", text: "text-warning" };
}

/** Indicador circular del porcentaje de compatibilidad. */
export function CompatibilityRing({ value, size = 56, className }: { value: number; size?: number; className?: string }) {
  const radius = 15.5;
  const circumference = 2 * Math.PI * radius;
  const nivel = nivelCompatibilidad(value);

  return (
    <div
      role="img"
      aria-label={`${value} % de compatibilidad`}
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle cx="18" cy="18" r={radius} fill="none" strokeWidth="3.5" className="stroke-arena-200" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className={cn(nivel.stroke, "transition-[stroke-dashoffset] duration-700 ease-gentle")}
        />
      </svg>
      <span
        className={cn("absolute inset-0 grid place-items-center font-bold tracking-tight", nivel.text)}
        style={{ fontSize: Math.round(size * (value === 100 ? 0.22 : 0.25)) }}
        aria-hidden="true"
      >
        {value}%
      </span>
    </div>
  );
}

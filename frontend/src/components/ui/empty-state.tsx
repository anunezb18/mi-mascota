import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  tone?: "primary" | "secondary" | "destructive";
}

const TONES = {
  primary: { blob: "fill-terracota-100", ring: "bg-terracota-50", icon: "text-primary" },
  secondary: { blob: "fill-pino-100", ring: "bg-pino-50", icon: "text-secondary" },
  destructive: { blob: "fill-destructive-soft", ring: "bg-white", icon: "text-destructive" },
} as const;

/**
 * Estado vacío con ilustración: ícono sobre una forma orgánica (motivo visual de la marca).
 */
export function EmptyState({ icon: Icon, title, description, action, className, tone = "primary" }: EmptyStateProps) {
  const colors = TONES[tone];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-arena-300 bg-card/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative mb-5 grid size-28 place-items-center" aria-hidden="true">
        <svg viewBox="0 0 120 120" className="absolute inset-0 size-full">
          <path
            className={colors.blob}
            d="M60 6c17 0 35 7 45 21s12 33 6 49-20 30-37 36-37 3-51-8S1 74 4 56 17 21 31 13 43 6 60 6Z"
          />
        </svg>
        <span className={cn("relative grid size-14 place-items-center rounded-full shadow-card", colors.ring)}>
          <Icon className={cn("size-7", colors.icon)} strokeWidth={1.75} />
        </span>
        <PawDots className="absolute -right-1 top-2 text-arena-300" />
      </div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-muted-foreground text-pretty">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

/** Pequeño rastro de huellas decorativo. */
function PawDots({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} fill="currentColor">
      <ellipse cx="12" cy="15.5" rx="4.5" ry="3.8" />
      <circle cx="6.5" cy="10" r="2" />
      <circle cx="10" cy="6.5" r="2" />
      <circle cx="14" cy="6.5" r="2" />
      <circle cx="17.5" cy="10" r="2" />
    </svg>
  );
}

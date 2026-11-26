import type * as React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Texto pequeño sobre el título (sección o contexto). */
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>}
        <h1 className="font-display text-display-sm font-semibold md:text-display-md">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

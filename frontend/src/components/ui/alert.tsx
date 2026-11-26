import { type VariantProps, cva } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva("flex gap-3 rounded-xl border p-4 text-sm [&_a]:font-semibold [&_a]:underline", {
  variants: {
    variant: {
      info: "border-info/20 bg-info-soft text-info [&_p]:text-arena-800",
      success: "border-success/20 bg-success-soft text-success [&_p]:text-arena-800",
      warning: "border-warning/25 bg-warning-soft text-warning [&_p]:text-arena-800",
      destructive: "border-destructive/20 bg-destructive-soft text-destructive [&_p]:text-arena-800",
    },
  },
  defaultVariants: { variant: "info" },
});

const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle, destructive: XCircle };

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
}

/** Mensaje en línea (avisos, errores de formulario, confirmaciones). */
export function Alert({ className, variant = "info", title, children, ...props }: AlertProps) {
  const Icon = ICONS[variant ?? "info"];
  return (
    <div
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        {title && <strong className="font-semibold">{title}</strong>}
        {children && <div className="text-arena-800">{children}</div>}
      </div>
    </div>
  );
}

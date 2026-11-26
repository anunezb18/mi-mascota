import { cn } from "@/lib/utils";

/** Bloque de carga con brillo animado. Se oculta a lectores de pantalla. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-lg bg-arena-200/70",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };

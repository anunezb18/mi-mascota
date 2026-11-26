import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm shadow-inner-soft transition-colors",
        "placeholder:text-muted-foreground/80 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "hover:border-arena-400 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/25",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };

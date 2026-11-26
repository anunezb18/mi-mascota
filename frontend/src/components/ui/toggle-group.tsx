import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Grupo de botones segmentados (p. ej. vista lista / mapa). */
const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("inline-flex items-center gap-1 rounded-full bg-muted p-1", className)}
    {...props}
  />
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center gap-2 rounded-full px-3.5 text-sm font-semibold text-muted-foreground transition-all",
      "hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-soft [&_svg]:size-4",
      className,
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

/** Chip seleccionable (filtros de temperamento, especie). */
const ChipToggleGroup = ToggleGroupPrimitive.Root;

const ChipToggle = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center gap-1.5 rounded-full border border-input bg-card px-3.5 text-sm font-medium transition-all duration-200",
      "hover:border-arena-400 data-[state=on]:border-primary data-[state=on]:bg-primary-soft data-[state=on]:text-terracota-800 [&_svg]:size-4",
      className,
    )}
    {...props}
  />
));
ChipToggle.displayName = "ChipToggle";

export { ChipToggle, ChipToggleGroup, ToggleGroup, ToggleGroupItem };

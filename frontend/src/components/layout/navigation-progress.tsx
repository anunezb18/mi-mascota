import * as React from "react";
import { useNavigation } from "react-router-dom";

import { cn } from "@/lib/utils";

/**
 * Barra de progreso superior mientras se descarga la siguiente pantalla.
 * Solo aparece si la navegación tarda más de 150 ms, para no parpadear.
 */
export function NavigationProgress() {
  const navigation = useNavigation();
  const loading = navigation.state !== "idle";
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!loading) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="h-full w-1/3 animate-nav-progress bg-gradient-to-r from-transparent via-primary to-transparent" />
    </div>
  );
}

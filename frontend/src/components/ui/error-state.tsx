import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getErrorMessage } from "@/lib/api-client";

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

/** Mensaje de error claro con opción de reintentar la consulta. */
export function ErrorState({ error, title = "No pudimos cargar la información", onRetry, className }: ErrorStateProps) {
  return (
    <div role="alert" className={className}>
      <EmptyState
        tone="destructive"
        icon={AlertTriangle}
        title={title}
        description={getErrorMessage(error)}
        action={
          onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RotateCw aria-hidden="true" />
              Reintentar
            </Button>
          )
        }
      />
    </div>
  );
}

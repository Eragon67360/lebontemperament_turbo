"use client";

import { ErrorState } from "@/components/ui/data-state";
import { useEffect } from "react";

/**
 * Keeps a crashing page inside the dashboard shell: the nav stays usable and
 * the user can retry without a full reload.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Cette page n'a pas pu s'afficher"
      description="Une erreur inattendue est survenue. Vous pouvez réessayer ou changer de page."
      onRetry={reset}
      className="h-full"
    />
  );
}

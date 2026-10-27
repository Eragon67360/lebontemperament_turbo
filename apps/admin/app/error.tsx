"use client";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/data-state";
import RouteNames from "@/utils/routes";
import Link from "next/link";
import { useEffect } from "react";

/**
 * The admin's error boundary outside the dashboard shell: the sign-in and
 * password pages, « Pas d’accès », and the shell's own layout. The page is
 * framed like the other pages without a sidebar (`AuthLayout`, the brand as
 * the h1) and shows the same `ErrorState` as a failed list, whose
 * « Réessayer » re-fetches and re-renders the failing segment (`retry`); the
 * screen has no filled button, like a page without a primary action. Inside
 * the dashboard, `dashboard/error.tsx` keeps the shell around the error.
 */
export default function RootError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AuthLayout brandIsHeading>
      <ErrorState
        title="Cette page n’a pas pu s’afficher"
        description="Une erreur inattendue est survenue. Vous pouvez réessayer ou revenir à l’accueil."
        onRetry={retry}
        className="px-0 pt-2 pb-4"
      />
      <div className="flex justify-center">
        <Button asChild variant="link">
          <Link href={RouteNames.DASHBOARD.ROOT}>Retour à l’accueil</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}

"use client";

import { LinkButton } from "@/components/LinkButton";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useEffect } from "react";
import { IoHome, IoRefresh } from "react-icons/io5";

/**
 * The site's error boundary. A client render error or a lazy chunk that
 * fails to load (typical right after a deployment) on any page lands here,
 * inside the site's navigation and footer and in the look of the not-found
 * page, instead of Next's unbranded English page. « Réessayer » re-fetches
 * and re-renders the failing segment (`retry`). The members area and the
 * delivery tracking have their own boundaries; the root layout itself is
 * covered by `global-error.tsx`.
 */
export default function ErrorPage({
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
    <section
      className="bg-surface-secondary relative flex min-h-screen w-full flex-col items-center justify-center"
      aria-labelledby="error-title"
    >
      <div
        role="alert"
        className="bg-background relative z-10 mx-4 max-w-md rounded-lg p-8 text-center shadow-md"
      >
        <h1
          id="error-title"
          className="text-foreground mb-4 text-4xl font-bold"
        >
          Une erreur est survenue
        </h1>
        <p className="text-muted mb-8 text-lg">
          Désolé, cette page n’a pas pu s’afficher. Vous pouvez réessayer ou
          revenir à l’accueil.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button variant="primary" size="lg" onPress={retry}>
            <IoRefresh className="shrink-0" aria-hidden />
            Réessayer
          </Button>
          <LinkButton variant="outline" size="lg" href="/">
            <IoHome className="shrink-0" aria-hidden />
            Retour à l’accueil
          </LinkButton>
        </div>

        <p className="text-muted mt-8 text-sm">
          Si le problème persiste,{" "}
          <Link
            href="/contact"
            className="text-primary-text underline underline-offset-2 hover:no-underline"
          >
            contactez-nous
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

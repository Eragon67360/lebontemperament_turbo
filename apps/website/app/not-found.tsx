"use client";
import { LinkButton } from "@/components/LinkButton";
import { Button } from "@heroui/react";
import Link from "next/link";
import { IoArrowBack, IoHome } from "react-icons/io5";

export default function NotFound() {
  return (
    <div
      className="bg-surface-secondary relative flex min-h-screen w-full flex-col items-center justify-center"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="bg-background relative z-10 mx-4 max-w-md rounded-lg p-8 text-center shadow-md">
        <h1
          id="error-title"
          className="text-foreground mb-4 text-4xl font-bold"
        >
          404 - Page non trouvée
        </h1>
        <p className="text-muted mb-8 text-lg">
          Désolé, la page que vous recherchez n&apos;existe pas ou a été
          déplacée.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <LinkButton
            size="lg"
            variant="primary"
            aria-label="Retour à la page d'accueil"
            href="/"
          >
            <IoHome className="shrink-0" />
            Retour à l&apos;accueil
          </LinkButton>

          <Button
            variant="outline"
            size="lg"
            onPress={() => window.history.back()}
            aria-label="Retour à la page précédente"
          >
            <IoArrowBack className="shrink-0" />
            Page précédente
          </Button>
        </div>

        <div className="text-muted mt-8 text-sm">
          <p>Vous pouvez également :</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link
                href="/concerts"
                className="text-primary hover:underline"
                aria-label="Voir nos concerts"
              >
                Voir nos concerts
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-primary hover:underline"
                aria-label="Nous contacter"
              >
                Nous contacter
              </Link>
            </li>
            <li>
              <Link
                href="/decouvrir"
                className="text-primary hover:underline"
                aria-label="Nous découvrir"
              >
                Nous découvrir
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

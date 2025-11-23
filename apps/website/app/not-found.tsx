"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { IoHome, IoArrowBack } from "react-icons/io5";

export default function NotFound() {
  return (
    <div
      className="bg-default-50 relative flex min-h-screen w-full flex-col items-center justify-center"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="bg-content1 relative z-10 mx-4 max-w-md rounded-lg p-8 text-center shadow-md">
        <h1
          id="error-title"
          className="text-foreground mb-4 text-4xl font-bold"
        >
          404 - Page non trouvée
        </h1>
        <p className="text-default-600 mb-8 text-lg">
          Désolé, la page que vous recherchez n&apos;existe pas ou a été
          déplacée.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            as={Link}
            href="/"
            color="primary"
            size="lg"
            startContent={<IoHome className="shrink-0" />}
            aria-label="Retour à la page d'accueil"
          >
            Retour à l&apos;accueil
          </Button>

          <Button
            variant="bordered"
            size="lg"
            startContent={<IoArrowBack className="shrink-0" />}
            onPress={() => window.history.back()}
            aria-label="Retour à la page précédente"
          >
            Page précédente
          </Button>
        </div>

        <div className="text-default-500 mt-8 text-sm">
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

"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { IoHome, IoArrowBack } from "react-icons/io5";

export default function NotFound() {
  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center bg-cover bg-center text-gray-800"
      style={{ backgroundImage: "url(/img/not_found.webp)" }}
      role="main"
      aria-labelledby="error-title"
    >
      {/* Overlay for better text readability */}
      <div className="bg-opacity-40 absolute inset-0 bg-black"></div>

      <div className="bg-opacity-95 relative z-10 mx-4 max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <h1 id="error-title" className="mb-4 text-4xl font-bold text-gray-800">
          404 - Page non trouvée
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Désolé, la page que vous recherchez n&apos;existe pas ou a été
          déplacée.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            as={Link}
            href="/"
            color="primary"
            size="lg"
            startContent={<IoHome />}
            aria-label="Retour à la page d'accueil"
          >
            Retour à l&apos;accueil
          </Button>

          <Button
            variant="bordered"
            size="lg"
            startContent={<IoArrowBack />}
            onPress={() => window.history.back()}
            aria-label="Retour à la page précédente"
          >
            Page précédente
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
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

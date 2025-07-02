"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { IoHome, IoArrowBack } from "react-icons/io5";

export default function NotFound() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center text-gray-800 relative"
      style={{ backgroundImage: "url(/img/not_found.webp)" }}
      role="main"
      aria-labelledby="error-title"
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      <div className="relative z-10 bg-white bg-opacity-95 p-8 rounded-lg shadow-lg text-center max-w-md mx-4">
        <h1 id="error-title" className="text-4xl font-bold mb-4 text-gray-800">
          404 - Page non trouvée
        </h1>
        <p className="text-lg mb-8 text-gray-600">
          Désolé, la page que vous recherchez n&apos;existe pas ou a été
          déplacée.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

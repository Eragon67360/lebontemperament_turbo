"use client";

import type { ListedCollection } from "@/lib/siteDocuments";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaRegFilePdf } from "react-icons/fa6";
import { MdOpenInNew } from "react-icons/md";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; collections: ListedCollection[] };

/**
 * The members area's archives after the CA minutes: one card per collection
 * of « Documents de l'association » (managed in the admin), newest first.
 */
export function DocumentArchives({
  firstDelay = 0.2,
}: {
  firstDelay?: number;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/documents")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ collections: ListedCollection[] }>;
      })
      .then(({ collections }) => {
        if (!cancelled) setState({ status: "ready", collections });
      })
      .catch((error) => {
        console.error("Error fetching documents:", error);
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status !== "ready") {
    return (
      <div className="bg-surface-secondary/80 rounded-xl p-4 md:p-6">
        <p className="text-muted text-sm" role="status">
          {state.status === "loading"
            ? "Chargement des archives…"
            : "Les archives n'ont pas pu être chargées. Réessayez dans un instant."}
        </p>
      </div>
    );
  }

  return (
    <>
      {state.collections.map((collection, index) => (
        <motion.section
          key={collection.slug}
          aria-labelledby={`archives-${collection.slug}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: firstDelay + index * 0.1 }}
          className="group relative overflow-hidden rounded-xl"
        >
          <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
          <div className="bg-surface-secondary/80 group-hover:bg-surface-tertiary/80 relative z-10 backdrop-blur-sm transition-all duration-300">
            <div className="flex items-start gap-3 p-4 md:p-6">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="bg-primary/10 rounded-lg p-2"
              >
                <MdOpenInNew className="text-primary h-5 w-5" />
              </motion.div>
              <div className="flex-1">
                <h3
                  id={`archives-${collection.slug}`}
                  className="from-primary via-foreground mb-1 bg-gradient-to-r to-purple-500 bg-clip-text text-lg font-bold text-transparent"
                >
                  {collection.label}
                </h3>
                {collection.description && (
                  <p className="text-foreground/60 text-sm">
                    {collection.description}
                  </p>
                )}
              </div>
            </div>
            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <ul className="mt-2 flex flex-wrap gap-6">
                {collection.documents.map((document) => (
                  <li key={document.id}>
                    <Link
                      href={document.href}
                      target="_blank"
                      rel="noopener"
                      prefetch={false}
                      className="bg-primary-solid hover:bg-primary-solid-hover flex items-center gap-4 rounded-lg p-2 text-xs text-white md:text-sm lg:p-4"
                    >
                      <FaRegFilePdf aria-hidden />
                      <span>
                        {document.title}
                        <span className="sr-only"> (PDF, nouvel onglet)</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>
      ))}
    </>
  );
}

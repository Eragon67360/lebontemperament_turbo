"use client";

import type { ListedCollection } from "@/lib/siteDocuments";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IoDocumentTextOutline } from "react-icons/io5";
import { DocumentCard } from "./DocumentCard";
import { membersButtonClass } from "./MembersButton";
import { MembersCard } from "./MembersCard";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; collections: ListedCollection[] };

/**
 * The members area's archives after the CA minutes: one card per collection
 * of « Documents de l'association » (managed in the admin), newest first.
 */
export function DocumentArchives() {
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
      <MembersCard className="p-5 sm:p-7">
        <p role="status">
          {state.status === "loading"
            ? "Chargement des archives…"
            : "Les archives n’ont pas pu être chargées. Réessaie dans un instant."}
        </p>
      </MembersCard>
    );
  }

  return (
    <>
      {state.collections.map((collection) => (
        <DocumentCard
          key={collection.slug}
          id={`archives-${collection.slug}`}
          icon={IoDocumentTextOutline}
          title={collection.label}
          description={collection.description || undefined}
        >
          <ul className="flex flex-wrap gap-3">
            {collection.documents.map((document) => (
              <li key={document.id}>
                <Link
                  href={document.href}
                  target="_blank"
                  rel="noopener"
                  prefetch={false}
                  className={membersButtonClass("solid", "text-base", "md")}
                >
                  <IoDocumentTextOutline
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                  <span>
                    {document.title}
                    <span className="sr-only"> (PDF, nouvel onglet)</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </DocumentCard>
      ))}
    </>
  );
}

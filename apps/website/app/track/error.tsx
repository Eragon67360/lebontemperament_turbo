"use client";

import { useEffect } from "react";
import { TrackPageError } from "./shared";

/**
 * The delivery tracking's error boundary. When the map or its lazy chunk
 * fails to load (typical right after a deployment), the recipient sees the
 * tracking page's own error panel instead of Next's default page. Its button
 * reloads the page, which fetches the current build: a re-render alone
 * (`retry`) would ask for the same stale chunk.
 */
export default function TrackError({ error }: { error: unknown }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <TrackPageError message="Le suivi n’a pas pu s’afficher. Réactualisez la page pour réessayer." />
  );
}

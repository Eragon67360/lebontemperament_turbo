"use client";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { RefreshCw } from "lucide-react";

/** A query of a home section that failed, named for the reader. */
export type FailedSource = {
  /** With its article: « vos messages », « la synchronisation Drive ». */
  label: string;
  retry: () => void;
};

function joinFr(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;
}

/**
 * A section built from several queries keeps showing what loaded and says
 * what did not, instead of going blank because one source failed.
 */
export function SourceNote({
  failed,
  className,
}: {
  failed: FailedSource[];
  className?: string;
}) {
  if (failed.length === 0) return null;
  return (
    <Callout
      tone="warning"
      title="Une partie des informations manque"
      className={className}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => failed.forEach((source) => source.retry())}
        >
          <RefreshCw aria-hidden />
          Réessayer
        </Button>
      }
    >
      <p>Le chargement a échoué pour {joinFr(failed.map((s) => s.label))}.</p>
    </Callout>
  );
}

/** The loading / all-failed / some-failed facts of a group of queries. */
export function sourceStates(
  sources: {
    label: string;
    isLoading: boolean;
    isError: boolean;
    refetch: () => unknown;
  }[],
) {
  return {
    isLoading: sources.some((source) => source.isLoading),
    isError: sources.length > 0 && sources.every((source) => source.isError),
    failed: sources
      .filter((source) => source.isError)
      .map<FailedSource>((source) => ({
        label: source.label,
        retry: () => void source.refetch(),
      })),
    retryAll: () => sources.forEach((source) => void source.refetch()),
  };
}

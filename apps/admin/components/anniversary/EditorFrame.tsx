"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/data-state";
import { Skeleton } from "@/components/ui/skeleton";
import * as React from "react";

/** The loading placeholder of a one-record editor (hero, form settings). */
export function EditorSkeleton({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="space-y-6 py-6" role="status" aria-busy>
        <span className="sr-only">{label}</span>
        <Skeleton className="h-11 w-full" aria-hidden />
        <Skeleton className="h-11 w-full" aria-hidden />
        <Skeleton className="h-28 w-full" aria-hidden />
      </CardContent>
    </Card>
  );
}

/**
 * A failed load blocks editing: an empty form whose « Enregistrer » would
 * blank the live content must never be shown.
 */
export function EditorLoadError({
  description,
  onRetry,
}: {
  description: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardContent className="py-6">
        <ErrorState description={description} onRetry={onRetry} />
      </CardContent>
    </Card>
  );
}

/** A titled group of fields inside an editor. */
export function FieldGroup({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {intro && <p className="text-detail text-muted-foreground">{intro}</p>}
      </CardHeader>
      <CardContent className="space-y-5 pt-2">{children}</CardContent>
    </Card>
  );
}

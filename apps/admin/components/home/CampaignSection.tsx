"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { DataState } from "@/components/ui/data-state";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAnniversaryReadiness } from "@/hooks/useAnniversaryReadiness";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { plural } from "@/utils/driveSync";
import { summarizeReadiness } from "@/utils/home/tasks";
import RouteNames from "@/utils/routes";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/** The feature flag that publishes the 40 ans page (same key as the overview). */
export const ANNIVERSARY_FLAG = "anniversary_40_years";

/**
 * The campaign's state at a glance: published or hidden, N sections ready
 * out of 10, what is left, and the door to « Vue d'ensemble et publication ».
 */
export function CampaignSection({ className }: { className?: string }) {
  const flag = useFeatureFlag(ANNIVERSARY_FLAG);
  const readiness = useAnniversaryReadiness();

  const published = flag.data?.is_enabled === true;
  const summary = readiness.data ? summarizeReadiness(readiness.data) : null;
  const percent = summary
    ? Math.round((summary.ready / Math.max(summary.total, 1)) * 100)
    : 0;

  return (
    <section aria-labelledby="camp-h" className={className}>
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="min-w-0 space-y-1.5">
            <h2 id="camp-h" className="text-[17px] leading-6 font-semibold">
              Campagne 40 ans
            </h2>
            <CardDescription>
              {flag.data
                ? published
                  ? "La page est en ligne pour tous les visiteurs du site."
                  : "Publication prévue début 2027 : la page reste masquée jusqu’à ce que vous la publiiez."
                : "La page des 40 ans et sa publication."}
            </CardDescription>
          </div>
          {flag.isLoading ? (
            <Skeleton className="h-7 w-20 shrink-0 rounded-full" aria-hidden />
          ) : flag.data ? (
            <StatusBadge
              tone={published ? "success" : "neutral"}
              className="shrink-0"
            >
              {published ? "Publiée" : "Masquée"}
            </StatusBadge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          <DataState
            isLoading={readiness.isLoading}
            isError={readiness.isError}
            onRetry={() => readiness.refetch()}
            errorDescription="L'état des sections n'a pas pu être calculé."
            skeleton={
              <div role="status" aria-busy className="space-y-3">
                <span className="sr-only">Calcul de l’état des sections…</span>
                <Skeleton className="h-5 w-48" aria-hidden />
                <Skeleton className="h-2 w-full" aria-hidden />
                <Skeleton className="h-4 w-3/4" aria-hidden />
              </div>
            }
          >
            {summary && (
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-body font-semibold">
                    {plural(summary.ready, "section prête", "sections prêtes")}{" "}
                    sur {summary.total}
                  </p>
                  <p className="text-detail text-muted-foreground tabular-nums">
                    {percent} %
                  </p>
                </div>
                <Progress
                  value={percent}
                  aria-label="Sections prêtes"
                  className="mt-2"
                />
                <p className="text-detail text-muted-foreground mt-3">
                  {summary.sectionsToComplete > 0
                    ? `À compléter : ${summary.sectionLabels.join(", ")}.`
                    : "Toutes les sections sont prêtes."}
                  {summary.pendingMemories > 0 &&
                    ` ${plural(summary.pendingMemories, "témoignage attend", "témoignages attendent")} votre avis.`}
                </p>
              </div>
            )}
          </DataState>
          {flag.isError && (
            <p className="text-detail text-muted-foreground">
              L’état de publication n’a pas pu être lu.{" "}
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => flag.refetch()}
              >
                Réessayer
              </Button>
            </p>
          )}
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href={RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.ROOT}>
              Ouvrir la campagne
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

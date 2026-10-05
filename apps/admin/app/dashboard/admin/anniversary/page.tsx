"use client";

import {
  PUBLIC_PAGE,
  PublicationDialog,
} from "@/components/anniversary/PublicationDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataState, ErrorState } from "@/components/ui/data-state";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Stepper } from "@/components/ui/stepper";
import { useAnniversaryReadiness } from "@/hooks/useAnniversaryReadiness";
import { useFeatureFlag, useUpdateFeatureFlag } from "@/hooks/useFeatureFlags";
import { cn } from "@/lib/utils";
import type {
  ReadinessRow,
  ReadinessState,
} from "@/utils/anniversary/readiness";
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  ExternalLink,
  EyeOff,
  Globe,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const FLAG = "anniversary_40_years";

const STATE: Record<
  ReadinessState,
  { icon: LucideIcon; className: string; word: string }
> = {
  ready: { icon: CircleCheck, className: "text-success", word: "Prêt" },
  attention: {
    icon: CircleAlert,
    className: "text-warning",
    word: "À vérifier",
  },
  empty: {
    icon: CircleDashed,
    className: "text-foreground-faint",
    word: "Vide",
  },
};

function publicUrl() {
  const base =
    process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://www.lebontemperament.com";
  return `${base.replace(/\/$/, "")}/40-ans`;
}

export default function AnniversaryOverviewPage() {
  const flag = useFeatureFlag(FLAG);
  const readiness = useAnniversaryReadiness();
  const updateFlag = useUpdateFeatureFlag();
  const [dialog, setDialog] = useState<"publish" | "hide" | null>(null);

  const published = flag.data?.is_enabled === true;
  const rows = readiness.data?.rows ?? [];
  const notReady = rows
    .filter((row) => row.state !== "ready")
    .map((row) => row.label);

  const setPublished = async (next: boolean) => {
    try {
      await updateFlag.mutateAsync({ flag_key: FLAG, is_enabled: next });
      setDialog(null);
      toast.success(
        next
          ? "La page des 40 ans est publiée"
          : "La page des 40 ans est masquée",
      );
    } catch (error) {
      toast.error(
        next ? "La publication a échoué" : "La page n'a pas pu être masquée",
        { description: error instanceof Error ? error.message : undefined },
      );
    }
  };

  const currentStep = published ? 3 : readiness.data?.publishable ? 1 : 0;

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Vue d’ensemble et publication"
      description="Vérifiez chaque section, puis publiez la page des 40 ans quand tout est prêt : rien n'est visible des visiteurs avant."
    >
      <div className="flex flex-col gap-6">
        <Stepper
          aria-label="Les étapes de la publication"
          current={currentStep}
          steps={[
            {
              label: "Préparer",
              description: "Remplir chaque section de la page.",
            },
            {
              label: "Vérifier",
              description:
                "Relire la liste ci-dessous et prévisualiser la page.",
            },
            {
              label: "Publier",
              description:
                "Une confirmation qui dit ce qui change pour les visiteurs.",
            },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          <Card>
            <CardHeader>
              <CardTitle>Contenu de la page</CardTitle>
              <CardDescription>
                Une ligne par section : son état et ce qu&apos;il reste à faire.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataState
                isLoading={readiness.isLoading}
                isError={readiness.isError}
                onRetry={() => readiness.refetch()}
                errorDescription="L'état des sections n'a pas pu être calculé."
                skeleton={
                  <div role="status" aria-busy className="space-y-3">
                    <span className="sr-only">
                      Calcul de l&apos;état des sections…
                    </span>
                    {Array.from({ length: 6 }, (_, index) => (
                      <Skeleton
                        key={index}
                        className="h-12 w-full"
                        aria-hidden
                      />
                    ))}
                  </div>
                }
              >
                {readiness.data && (
                  <>
                    <div className="mb-4 space-y-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-body font-semibold">
                          {readiness.data.ready} section
                          {readiness.data.ready > 1 ? "s" : ""} prête
                          {readiness.data.ready > 1 ? "s" : ""} sur{" "}
                          {readiness.data.total}
                        </p>
                        <p className="text-detail text-muted-foreground tabular-nums">
                          {Math.round(
                            (readiness.data.ready / readiness.data.total) * 100,
                          )}{" "}
                          %
                        </p>
                      </div>
                      <Progress
                        value={
                          (readiness.data.ready / readiness.data.total) * 100
                        }
                        aria-label="Sections prêtes"
                      />
                    </div>
                    <ul className="divide-border -mx-4 divide-y sm:-mx-6">
                      {rows.map((row) => (
                        <ReadinessLine key={row.key} row={row} />
                      ))}
                    </ul>
                  </>
                )}
              </DataState>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publication</CardTitle>
              <CardDescription>
                Ce que voient les visiteurs sur {PUBLIC_PAGE}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {flag.isLoading ? (
                <div role="status" aria-busy className="space-y-3">
                  <span className="sr-only">
                    Chargement de l&apos;état de publication…
                  </span>
                  <Skeleton className="h-7 w-28" aria-hidden />
                  <Skeleton className="h-11 w-full" aria-hidden />
                </div>
              ) : flag.isError || !flag.data ? (
                <ErrorState
                  description="L'état de publication n'a pas pu être lu."
                  onRetry={() => flag.refetch()}
                  className="py-4"
                />
              ) : (
                <>
                  <div className="space-y-2">
                    <StatusBadge tone={published ? "success" : "neutral"}>
                      {published ? "Publiée" : "Masquée"}
                    </StatusBadge>
                    <p className="text-detail text-muted-foreground">
                      {published
                        ? "La page est en ligne pour tous les visiteurs, avec son lien dans le menu, la section d'accueil et le bouton flottant."
                        : "Les visiteurs voient une erreur 404 ; connecté à l'administration, vous pouvez la prévisualiser."}
                    </p>
                    {flag.data.updated_at && (
                      <p className="text-note text-muted-foreground">
                        Dernier changement le{" "}
                        {new Date(flag.data.updated_at).toLocaleString(
                          "fr-FR",
                          {
                            dateStyle: "long",
                            timeStyle: "short",
                          },
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button variant="outline" asChild>
                      <a href={publicUrl()} target="_blank" rel="noreferrer">
                        <ExternalLink aria-hidden />
                        {published ? "Voir la page" : "Prévisualiser la page"}
                        <span className="sr-only"> (nouvel onglet)</span>
                      </a>
                    </Button>
                    {!published && (
                      <Button onClick={() => setDialog("publish")}>
                        <Globe aria-hidden />
                        Publier la page
                      </Button>
                    )}
                  </div>

                  {published && (
                    <section
                      aria-labelledby="sensitive-h"
                      className="border-border space-y-3 rounded-md border p-4"
                    >
                      <div>
                        <h3
                          id="sensitive-h"
                          className="text-body font-semibold"
                        >
                          Actions sensibles
                        </h3>
                        <p className="text-detail text-muted-foreground">
                          Masquer la page la retire du site pour tout le monde,
                          sans rien effacer.
                        </p>
                      </div>
                      <Button
                        variant="destructive-outline"
                        onClick={() => setDialog("hide")}
                      >
                        <EyeOff aria-hidden />
                        Masquer la page
                      </Button>
                    </section>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PublicationDialog
        open={dialog === "publish"}
        onOpenChange={(open) => setDialog(open ? "publish" : null)}
        action="publish"
        notReady={notReady}
        isPending={updateFlag.isPending}
        onConfirm={() => setPublished(true)}
      />
      <PublicationDialog
        open={dialog === "hide"}
        onOpenChange={(open) => setDialog(open ? "hide" : null)}
        action="hide"
        isPending={updateFlag.isPending}
        onConfirm={() => setPublished(false)}
      />
    </PageShell>
  );
}

function ReadinessLine({ row }: { row: ReadinessRow }) {
  const state = STATE[row.state];
  const Icon = state.icon;
  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-6">
      <Icon className={cn("size-5 shrink-0", state.className)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-5 font-medium">
          {row.label}
          <span className="sr-only"> : {state.word}.</span>
        </p>
        <p className="text-note text-muted-foreground">{row.reason}</p>
      </div>
      <Button
        variant={row.state === "ready" ? "ghost" : "outline"}
        size="sm"
        asChild
      >
        <Link href={row.href}>
          {row.action}
          <span className="sr-only"> : {row.label}</span>
        </Link>
      </Button>
    </li>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DataState,
  ErrorState,
  LoadingRegion,
} from "@/components/ui/data-state";
import { DateBlock } from "@/components/ui/date-block";
import { Skeleton } from "@/components/ui/skeleton";
import { useConcerts } from "@/hooks/useConcerts";
import { concertTitle, parseIsoDate } from "@/utils/concerts/schedule";
import {
  concertMetaFr,
  pickNextConcert,
  siteConcertsUrl,
  type NextConcertLike,
} from "@/utils/home/nextConcert";
import RouteNames from "@/utils/routes";
import { ExternalLink, Music2, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

/**
 * The poster the site shows (the concert's `affiche`), with its alt text;
 * null without one. Separate so the test can check it: `next/image` does not
 * render under the test runner's ESM import.
 */
export function posterOf(
  concert: Pick<NextConcertLike, "affiche" | "name" | "place">,
): { src: string; alt: string } | null {
  return concert.affiche
    ? { src: concert.affiche, alt: `Affiche de ${concertTitle(concert)}` }
    : null;
}

const POSTER =
  "bg-muted relative h-[220px] w-full shrink-0 overflow-hidden sm:h-auto sm:min-h-64 sm:w-60";

/**
 * « Prochain concert »: the poster the site shows, the programme-style date,
 * the title and its facts, then « Modifier le concert » and « Voir sur le
 * site ». Presentational, so the home test renders it without queries.
 */
export function NextConcertCard({
  concert,
  now = new Date(),
}: {
  concert: NextConcertLike;
  now?: Date;
}) {
  const title = concertTitle(concert);
  const date = parseIsoDate(concert.date);
  const meta = concertMetaFr(concert, now);
  const poster = posterOf(concert);

  return (
    <Card className="flex flex-col overflow-hidden sm:flex-row">
      <div className={POSTER}>
        {poster ? (
          <Image
            src={poster.src}
            alt={poster.alt}
            fill
            sizes="(min-width: 640px) 240px, 100vw"
            className="object-cover"
          />
        ) : (
          <Music2
            className="text-foreground-faint absolute inset-0 m-auto size-10"
            aria-hidden
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        <p className="text-note text-primary-text font-semibold tracking-[0.08em] uppercase">
          Prochain concert
        </p>
        <div className="flex items-start gap-5">
          {date && <DateBlock date={date} size="lg" tone="primary" />}
          <div className="min-w-0 flex-1 space-y-1.5">
            <h2 className="text-foreground text-2xl leading-8 font-semibold break-words">
              {title}
            </h2>
            <p className="text-detail text-muted-foreground">{meta.when}</p>
            {meta.details && (
              <p className="text-detail text-muted-foreground">
                {meta.details}
              </p>
            )}
          </div>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button variant="outline" asChild>
            <Link href={RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS}>
              <Pencil aria-hidden />
              Modifier le concert
            </Link>
          </Button>
          <Button variant="link" asChild className="px-0">
            <a href={siteConcertsUrl()} target="_blank" rel="noreferrer">
              Voir sur le site
              <ExternalLink aria-hidden />
              <span className="sr-only"> (nouvel onglet)</span>
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** The card's shape while the concerts load. */
function NextConcertSkeleton() {
  return (
    <LoadingRegion label="Chargement du prochain concert…">
      <Card className="flex flex-col overflow-hidden sm:flex-row">
        <Skeleton className="h-[220px] w-full shrink-0 rounded-none sm:h-64 sm:w-60" />
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-start gap-5">
            <Skeleton className="h-[68px] w-18 shrink-0" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <Skeleton className="mt-auto h-11 w-48" />
        </div>
      </Card>
    </LoadingRegion>
  );
}

/**
 * The next concert, right under the greeting. Reads the same concerts query
 * as « À venir » (one request for both) and disappears when nothing is
 * planned: « À venir » and the concerts page say so already.
 */
export function NextConcertSection({ className }: { className?: string }) {
  const concerts = useConcerts();
  const next = useMemo(() => pickNextConcert(concerts.data), [concerts.data]);

  if (concerts.isSuccess && !next) return null;

  return (
    <section aria-label="Prochain concert" className={className}>
      {concerts.isError ? (
        // DataState's error sits bare; here it keeps the card's frame.
        <Card>
          <ErrorState
            description="Le prochain concert n'a pas pu être chargé."
            onRetry={() => concerts.refetch()}
            className="py-8"
          />
        </Card>
      ) : (
        <DataState
          isLoading={concerts.isLoading}
          skeleton={<NextConcertSkeleton />}
        >
          {next && <NextConcertCard concert={next} />}
        </DataState>
      )}
    </section>
  );
}

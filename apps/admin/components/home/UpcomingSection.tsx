"use client";

import { SourceNote, sourceStates } from "@/components/home/SourceNote";
import { UpcomingRows } from "@/components/home/UpcomingRows";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { useConcerts } from "@/hooks/useConcerts";
import { useEvents } from "@/hooks/useEvents";
import { useRehearsals } from "@/hooks/useRehearsals";
import {
  mergeUpcoming,
  UPCOMING_LIMIT,
  UPCOMING_WINDOW_DAYS,
} from "@/utils/home/upcoming";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";

/**
 * « À venir »: the next rehearsals, events and concerts in one chronological
 * list. Each kind comes from its own query; one failing leaves the others.
 */
export function UpcomingSection({ className }: { className?: string }) {
  const rehearsals = useRehearsals();
  const events = useEvents();
  const concerts = useConcerts();

  const items = useMemo(
    () =>
      mergeUpcoming({
        rehearsals: rehearsals.data,
        events: events.data,
        concerts: concerts.data,
      }),
    [rehearsals.data, events.data, concerts.data],
  );

  const sources = sourceStates([
    { label: "les répétitions", ...rehearsals },
    { label: "les événements", ...events },
    { label: "les concerts", ...concerts },
  ]);

  return (
    <section aria-labelledby="agenda-h" className={className}>
      <Card>
        <CardHeader>
          <h2 id="agenda-h" className="text-[17px] leading-6 font-semibold">
            À venir
          </h2>
          <CardDescription>
            Les prochains rendez-vous de l’association dans les{" "}
            {UPCOMING_WINDOW_DAYS} jours, {UPCOMING_LIMIT} au plus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={sources.isLoading}
            isError={sources.isError}
            onRetry={sources.retryAll}
            errorDescription="L'agenda n'a pas pu être chargé."
            skeleton={<ListSkeleton rows={4} label="Chargement de l'agenda…" />}
          >
            {items.length > 0 ? (
              <UpcomingRows items={items} />
            ) : (
              <EmptyState
                icon={CalendarDays}
                title={`Rien de prévu dans les ${UPCOMING_WINDOW_DAYS} prochains jours`}
                description="Les répétitions, événements et concerts à venir apparaîtront ici dès qu'ils seront planifiés."
                className="py-8"
              />
            )}
            <SourceNote failed={sources.failed} className="mt-4" />
          </DataState>
        </CardContent>
      </Card>
    </section>
  );
}

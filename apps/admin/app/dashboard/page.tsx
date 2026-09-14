"use client";

import { ActivityFeed } from "@/components/ActivityFeed";
import { DashboardWelcomeHeader } from "@/components/DashboardWelcomeUser";
import { PageShell } from "@/components/layouts/PageShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CardGridSkeleton,
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useConcerts } from "@/hooks/useConcerts";
import { useEvents } from "@/hooks/useEvents";
import { useUsers } from "@/hooks/useUsers";
import { cn } from "@/lib/utils";
import RouteNames from "@/utils/routes";
import { Concert } from "@repo/domain/types/concerts";
import { Event } from "@repo/domain/types/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { ReactNode, useMemo } from "react";

const EVENT_TYPE_LABELS: Record<Event["event_type"], string> = {
  concert: "Concert",
  vente: "Vente",
  repetition: "Répétition",
  sejour: "Séjour",
  autre: "Autre",
};

const EVENT_TYPE_COLORS: Record<Event["event_type"], string> = {
  concert: "bg-purple-100 text-purple-700 border-purple-200",
  vente: "bg-green-100 text-green-700 border-green-200",
  repetition: "bg-blue-100 text-blue-700 border-blue-200",
  sejour: "bg-amber-100 text-amber-700 border-amber-200",
  autre: "bg-gray-100 text-gray-700 border-gray-200",
};

function getInitials(displayName: string | null): string {
  if (!displayName) return "??";
  return displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardPage() {
  const usersQuery = useUsers({ sortBy: "created_at", sortOrder: "desc" });
  const concertsQuery = useConcerts();
  const eventsQuery = useEvents();

  const totalUsers = usersQuery.data?.length ?? 0;
  const users = useMemo(
    () => (usersQuery.data ?? []).slice(0, 6),
    [usersQuery.data],
  );

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return (eventsQuery.data ?? [])
      .filter((event: Event) => {
        // date_to when the event spans several days, so it stays listed until it ends
        const endDate = new Date(event.date_to ?? event.date_from);
        return endDate >= now;
      })
      .sort(
        (a: Event, b: Event) =>
          new Date(a.date_from).getTime() - new Date(b.date_from).getTime(),
      )
      .slice(0, 6);
  }, [eventsQuery.data]);

  const concerts = useMemo(() => {
    const now = new Date();
    return (concertsQuery.data ?? [])
      .filter(
        (concert: Concert) =>
          new Date(`${concert.date}T${concert.time}`) >= now,
      )
      .sort(
        (a: Concert, b: Concert) =>
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime(),
      )
      .slice(0, 3);
  }, [concertsQuery.data]);

  return (
    <PageShell fullHeight contentClassName="pb-4">
      <DashboardWelcomeHeader />

      {/* Phones scroll the whole dashboard; from lg the columns fill the
          viewport and each card scrolls its own list. */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:overflow-hidden">
        <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2 lg:min-h-0">
            <div className="grid gap-4 md:grid-cols-2 lg:min-h-0 lg:flex-1">
              <SectionCard
                title="Utilisateurs récents"
                subtitle={
                  usersQuery.isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    `${totalUsers} utilisateur${totalUsers !== 1 ? "s" : ""} au total`
                  )
                }
                href={RouteNames.DASHBOARD.ADMIN.USERS}
              >
                <DataState
                  isLoading={usersQuery.isLoading}
                  isError={usersQuery.isError}
                  isEmpty={users.length === 0}
                  onRetry={() => usersQuery.refetch()}
                  errorDescription="Les utilisateurs n'ont pas pu être chargés."
                  skeleton={
                    <ListSkeleton
                      rows={5}
                      label="Chargement des utilisateurs…"
                    />
                  }
                  empty={
                    <EmptyState
                      icon={Users}
                      title="Aucun utilisateur"
                      className="py-8"
                    />
                  }
                >
                  <div className="space-y-1">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded-md p-2 transition-colors duration-150 ease-out hover:bg-gray-50"
                      >
                        <Avatar className="h-8 w-8 border border-gray-200">
                          <AvatarFallback className="bg-gray-50 text-xs font-medium text-gray-600">
                            {getInitials(user.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {user.display_name || "Utilisateur sans nom"}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DataState>
              </SectionCard>

              <SectionCard
                title="Événements à venir"
                subtitle={
                  eventsQuery.isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    `${upcomingEvents.length} événement${upcomingEvents.length !== 1 ? "s" : ""} à venir`
                  )
                }
                href={RouteNames.DASHBOARD.MEMBERS.EVENEMENTS}
              >
                <DataState
                  isLoading={eventsQuery.isLoading}
                  isError={eventsQuery.isError}
                  isEmpty={upcomingEvents.length === 0}
                  onRetry={() => eventsQuery.refetch()}
                  errorDescription="Les événements n'ont pas pu être chargés."
                  skeleton={
                    <ListSkeleton rows={4} label="Chargement des événements…" />
                  }
                  empty={
                    <EmptyState
                      icon={Calendar}
                      title="Aucun événement à venir"
                      className="py-8"
                    />
                  }
                >
                  <div className="space-y-2">
                    {upcomingEvents.map((event: Event) => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </div>
                </DataState>
              </SectionCard>
            </div>

            <SectionCard
              title="Prochains concerts"
              subtitle={
                concertsQuery.isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  `${concerts.length} concert${concerts.length !== 1 ? "s" : ""} à venir`
                )
              }
              href={RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS}
              className="lg:min-h-0 lg:flex-1"
            >
              <DataState
                isLoading={concertsQuery.isLoading}
                isError={concertsQuery.isError}
                isEmpty={concerts.length === 0}
                onRetry={() => concertsQuery.refetch()}
                errorDescription="Les concerts n'ont pas pu être chargés."
                skeleton={
                  <CardGridSkeleton
                    cards={3}
                    label="Chargement des concerts…"
                  />
                }
                empty={
                  <EmptyState
                    icon={Calendar}
                    title="Aucun concert planifié"
                    className="py-8"
                  />
                }
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {concerts.map((concert) => (
                    <ConcertCard key={concert.id} concert={concert} />
                  ))}
                </div>
              </DataState>
            </SectionCard>
          </div>

          <div className="min-h-64 lg:col-span-1 lg:min-h-0">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function SectionCard({
  title,
  subtitle,
  href,
  className,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "flex min-h-64 flex-col bg-white shadow-sm lg:min-h-0",
        className,
      )}
    >
      <CardHeader className="flex flex-none flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base font-semibold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {subtitle}
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
          <Link href={href}>Voir tout</Link>
        </Button>
      </CardHeader>
      <CardContent className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {children}
      </CardContent>
    </Card>
  );
}

function EventRow({ event }: { event: Event }) {
  const dateFrom = new Date(event.date_from);
  const dateTo = event.date_to ? new Date(event.date_to) : null;
  const isMultiDay = dateTo && dateTo.getTime() !== dateFrom.getTime();
  const shortDate = (date: Date) =>
    date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <div className="group flex items-start gap-3 rounded-md border border-gray-100 p-3 transition-colors duration-150 ease-out hover:border-gray-200 hover:bg-gray-50">
      <div className="bg-primary/10 text-primary shrink-0 rounded-md p-2">
        <Calendar className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="group-hover:text-primary truncate text-sm font-medium text-gray-900 transition-colors">
            {event.title}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
              EVENT_TYPE_COLORS[event.event_type],
            )}
          >
            {EVENT_TYPE_LABELS[event.event_type]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="truncate">
              {isMultiDay
                ? `${shortDate(dateFrom)} - ${shortDate(dateTo)}`
                : dateFrom.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                  })}
            </span>
          </div>
          {event.time && <span>{event.time}</span>}
        </div>
        {event.location && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="h-3 w-3 shrink-0" />
            <p className="truncate">{event.location}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConcertCard({ concert }: { concert: Concert }) {
  const startsAt = new Date(`${concert.date}T${concert.time}`);

  return (
    <div className="group hover:border-primary/50 flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 transition-[border-color,box-shadow] duration-150 ease-out hover:shadow-md">
      <div className="space-y-3">
        <div className="bg-primary/5 text-primary group-hover:bg-primary/10 w-fit rounded-md p-2 transition-colors">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <h4
            className="line-clamp-1 font-semibold text-gray-900"
            title={concert.name ?? "Concert sans nom"}
          >
            {concert.name || "Concert sans nom"}
          </h4>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="h-3 w-3 shrink-0" />
            <p className="line-clamp-1 text-xs">{concert.place}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
          {format(startsAt, "d MMM yyyy", { locale: fr })}
        </span>
        <span className="font-mono text-xs text-gray-400">
          {format(startsAt, "HH:mm", { locale: fr })}
        </span>
      </div>
    </div>
  );
}

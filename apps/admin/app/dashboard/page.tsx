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
import { Skeleton } from "@/components/ui/skeleton";
import { useConcerts } from "@/hooks/useConcerts";
import { useEvents } from "@/hooks/useEvents";
import { useUsers } from "@/hooks/useUsers";
import { Concert } from "@/types/concerts";
import RouteNames from "@/utils/routes";
import { Event } from "@repo/domain/types/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type User = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "admin" | "superadmin";
  created_at: string;
};

// Skeleton components
function EventRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg p-2.5">
      <Skeleton className="h-8 w-8 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[150px] rounded-md" />
        <Skeleton className="h-3 w-[120px] rounded-md" />
      </div>
    </div>
  );
}

function UserRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg p-2">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[150px] rounded-md" />
        <Skeleton className="h-3 w-[200px] rounded-md" />
      </div>
    </div>
  );
}

function ConcertRowSkeleton() {
  return (
    <div className="border-border/50 bg-muted/30 rounded-lg border p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[180px] rounded-md" />
        <Skeleton className="h-3 w-[140px] rounded-md" />
        <Skeleton className="h-3 w-[160px] rounded-md" />
      </div>
    </div>
  );
}

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
  // Fetch data using query hooks
  const { data: allUsers = [], isLoading } = useUsers({
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const { data: allConcertsData = [], isLoading: isLoadingConcerts } =
    useConcerts();

  const { data: allEvents = [], isLoading: isLoadingEvents } = useEvents();

  // Derive computed values using useMemo
  const users = useMemo(() => allUsers.slice(0, 6), [allUsers]);
  const totalUsers = allUsers.length;

  // Filter upcoming events
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return allEvents
      .filter((event: Event) => {
        // Use date_to if available, otherwise use date_from
        const endDate = event.date_to
          ? new Date(event.date_to)
          : new Date(event.date_from);
        // Keep events that haven't ended yet
        return endDate >= now;
      })
      .sort((a: Event, b: Event) => {
        return (
          new Date(a.date_from).getTime() - new Date(b.date_from).getTime()
        );
      })
      .slice(0, 6);
  }, [allEvents]);

  const concerts = useMemo(() => {
    const now = new Date();
    return allConcertsData
      .filter((concert: Concert) => {
        const concertDate = new Date(`${concert.date}T${concert.time}`);
        return concertDate >= now;
      })
      .sort((a: Concert, b: Concert) => {
        return (
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime()
        );
      })
      .slice(0, 3);
  }, [allConcertsData]);

  return (
    <PageShell className="h-full md:overflow-hidden">
      {/* Main Container - enforces fixed height on desktop */}
      <div className="my-2 flex min-h-0 grow flex-col gap-4 md:max-h-[calc(100dvh-3rem)]">
        <DashboardWelcomeHeader />

        {/* Main Grid: 1 Col Mobile, 3 Cols Desktop */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 pb-2 lg:grid-cols-3">
          {/* Left Column (Stats & Concerts) */}
          <div className="flex h-full min-h-0 flex-col gap-6 lg:col-span-2">
            {/* Top Row: Users & Events - Takes 50% available height on desktop */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-2">
              {/* Users Card */}
              <Card className="flex h-full min-h-0 flex-col bg-white shadow-sm">
                <CardHeader className="flex flex-none flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Utilisateurs récents
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {isLoading ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        `${totalUsers} utilisateur${totalUsers !== 1 ? "s" : ""} au total`
                      )}
                    </CardDescription>
                  </div>
                  <Link href={RouteNames.DASHBOARD.ADMIN.USERS}>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Voir tout
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, index) => (
                        <UserRowSkeleton key={index} />
                      ))}
                    </div>
                  ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="mb-3 h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        Aucun utilisateur trouvé
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-gray-50"
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
                  )}
                </CardContent>
              </Card>

              {/* Events Card */}
              <Card className="flex h-full min-h-0 flex-col bg-white shadow-sm">
                <CardHeader className="flex flex-none flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Événements à venir
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {isLoadingEvents ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        `${upcomingEvents.length} événement${upcomingEvents.length !== 1 ? "s" : ""} à venir`
                      )}
                    </CardDescription>
                  </div>
                  <Link href={RouteNames.DASHBOARD.MEMBERS.EVENEMENTS}>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Voir tout
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
                  {isLoadingEvents ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, index) => (
                        <EventRowSkeleton key={index} />
                      ))}
                    </div>
                  ) : upcomingEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Calendar className="mb-3 h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        Aucun événement à venir
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingEvents.map((event: Event) => {
                        const eventTypeLabels: Record<
                          Event["event_type"],
                          string
                        > = {
                          concert: "Concert",
                          vente: "Vente",
                          repetition: "Répétition",
                          sejour: "Séjour",
                          autre: "Autre",
                        };
                        const eventTypeColors: Record<
                          Event["event_type"],
                          string
                        > = {
                          concert:
                            "bg-purple-100 text-purple-700 border-purple-200",
                          vente: "bg-green-100 text-green-700 border-green-200",
                          repetition:
                            "bg-blue-100 text-blue-700 border-blue-200",
                          sejour:
                            "bg-amber-100 text-amber-700 border-amber-200",
                          autre: "bg-gray-100 text-gray-700 border-gray-200",
                        };

                        const dateFrom = new Date(event.date_from);
                        const dateTo = event.date_to
                          ? new Date(event.date_to)
                          : null;
                        const isMultiDay =
                          dateTo && dateTo.getTime() !== dateFrom.getTime();

                        return (
                          <div
                            key={event.id}
                            className="group flex items-start gap-3 rounded-md border border-gray-100 p-3 transition-all hover:border-gray-200 hover:bg-gray-50"
                          >
                            <div className="bg-primary/10 text-primary shrink-0 rounded-md p-2">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="group-hover:text-primary truncate text-sm font-medium text-gray-900 transition-colors">
                                  {event.title}
                                </p>
                                <span
                                  className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${eventTypeColors[event.event_type]}`}
                                >
                                  {eventTypeLabels[event.event_type]}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="truncate">
                                    {isMultiDay
                                      ? `${dateFrom.toLocaleDateString(
                                          "fr-FR",
                                          {
                                            day: "numeric",
                                            month: "short",
                                          },
                                        )} - ${dateTo.toLocaleDateString(
                                          "fr-FR",
                                          {
                                            day: "numeric",
                                            month: "short",
                                          },
                                        )}`
                                      : dateFrom.toLocaleDateString("fr-FR", {
                                          day: "numeric",
                                          month: "long",
                                        })}
                                  </span>
                                </div>
                                {event.time && (
                                  <div className="flex items-center gap-1">
                                    <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block" />
                                    <span>{event.time}</span>
                                  </div>
                                )}
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
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Concerts Card - Takes remaining 50% height */}
            <Card className="flex h-full min-h-0 flex-1 flex-col bg-white px-2 shadow-sm">
              <CardHeader className="flex flex-none flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Prochains concerts
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    {isLoadingConcerts ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      `${concerts.length} concert${concerts.length !== 1 ? "s" : ""} à venir`
                    )}
                  </CardDescription>
                </div>
                <Link href={RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Voir tout
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
                {isLoadingConcerts ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, index) => (
                      <ConcertRowSkeleton key={index} />
                    ))}
                  </div>
                ) : concerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      Aucun concert planifié
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {concerts.map((concert) => (
                      <div
                        key={concert.id}
                        className="group hover:border-primary/50 relative flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="bg-primary/5 text-primary group-hover:bg-primary/10 rounded-md p-2 transition-colors">
                              <Calendar className="h-4 w-4" />
                            </div>
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
                              <p className="line-clamp-1 text-xs">
                                {concert.place}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            {format(
                              new Date(`${concert.date}T${concert.time}`),
                              "d MMM yyyy",
                              { locale: fr },
                            )}
                          </span>
                          <span className="font-mono text-xs text-gray-400">
                            {format(
                              new Date(`${concert.date}T${concert.time}`),
                              "HH:mm",
                              { locale: fr },
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Activity Feed */}
          <div className="h-full min-h-0 lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

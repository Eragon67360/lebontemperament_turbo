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
import { Concert } from "@/types/concerts";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Music,
  Music2,
  Users,
  Users2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "admin" | "superadmin";
  created_at: string;
};
type Program = {
  id: string;
  name: string;
  created_at: string;
};

type Group = {
  id: string;
  name: string;
  slug: string;
  description: string;
  order_index: number;
};

// Skeleton components
function GroupRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg p-2.5">
      <Skeleton className="h-7 w-7 rounded-lg" />
      <Skeleton className="h-4 w-[150px] rounded-md" />
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
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [isLoadingConcerts, setIsLoadingConcerts] = useState(true);
  const [program, setProgram] = useState<Program | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingProgram, setIsLoadingProgram] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "/api/users?sortBy=created_at&sortOrder=desc",
        );
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setTotalUsers(data.length);
        setUsers(data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);
  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        setIsLoadingConcerts(true);
        const response = await fetch("/api/prochains-concerts");
        if (!response.ok) throw new Error("Failed to fetch concerts");
        const data = await response.json();
        const now = new Date();
        const futureConcerts = data
          .filter((concert: Concert) => {
            const concertDate = new Date(`${concert.date}T${concert.time}`);
            return concertDate >= now;
          })
          .sort((a: Concert, b: Concert) => {
            return (
              new Date(`${a.date}T${a.time}`).getTime() -
              new Date(`${b.date}T${b.time}`).getTime()
            );
          });
        setConcerts(futureConcerts.slice(0, 3));
      } catch (error) {
        console.error("Error fetching concerts:", error);
      } finally {
        setIsLoadingConcerts(false);
      }
    };

    fetchConcerts();
  }, []);
  useEffect(() => {
    const fetchProgramData = async () => {
      try {
        setIsLoadingProgram(true);
        const supabase = createClient();

        // Get current program (2024/2025)
        const { data: programData } = await supabase
          .from("programs")
          .select("*")
          .single();

        if (programData) {
          setProgram(programData);

          // Get groups
          const { data: groupsData } = await supabase
            .from("groups")
            .select("*")
            .order("order_index");

          if (groupsData) {
            setGroups(groupsData);
          }
        }
      } catch (error) {
        console.error("Error fetching program data:", error);
      } finally {
        setIsLoadingProgram(false);
      }
    };

    fetchProgramData();
  }, []);
  return (
    <PageShell className="h-full md:overflow-hidden">
      <div className="my-2 flex min-h-0 grow flex-col md:max-h-[calc(100dvh-3rem)]">
        <DashboardWelcomeHeader />

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 pb-2 md:overflow-hidden lg:grid-cols-3">
          {/* Left Column: Stats & Concerts */}
          <div className="flex h-full min-h-0 flex-col gap-6 lg:col-span-2">
            {/* Top Stats Row (Users & Program) - Takes 50% height */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-2">
              {/* Users Card */}
              <Card className="flex h-full flex-col bg-white">
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
                          className="flex items-center gap-3 rounded-md p-2 hover:bg-gray-50"
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

              {/* Program Card */}
              <Card className="flex h-full flex-col bg-white">
                <CardHeader className="flex flex-none flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Programme en cours
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {isLoadingProgram ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        `${groups.length} groupe${groups.length !== 1 ? "s" : ""} actif${groups.length !== 1 ? "s" : ""}`
                      )}
                    </CardDescription>
                  </div>
                  {program && (
                    <Link href={`/dashboard/travail/${program.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        Gérer
                      </Button>
                    </Link>
                  )}
                </CardHeader>
                <CardContent className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
                  {isLoadingProgram ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, index) => (
                        <GroupRowSkeleton key={index} />
                      ))}
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Music2 className="mb-3 h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        Aucun groupe trouvé
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {groups.map((group) => (
                        <Link
                          key={group.id}
                          href={`/dashboard/travail/${program?.id}/${group.slug}`}
                          className="block"
                        >
                          <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-100">
                            <div className="rounded-md bg-white p-1.5 shadow-sm ring-1 ring-gray-200">
                              {group.name.toLowerCase().includes("choeur") ? (
                                <Users2 className="text-primary h-4 w-4" />
                              ) : (
                                <Music2 className="text-primary h-4 w-4" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {group.name}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Concerts Card - Takes 50% height */}
            <Card className="flex h-full min-h-0 flex-1 flex-col bg-white px-2">
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
                        className="group hover:border-primary/50 relative flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="bg-primary/5 text-primary rounded-md p-2">
                              <Calendar className="h-4 w-4" />
                            </div>
                          </div>
                          <div>
                            <h4 className="line-clamp-1 font-medium text-gray-900">
                              {concert.name || "Concert sans nom"}
                            </h4>
                            <p className="line-clamp-1 text-sm text-gray-500">
                              {concert.place}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                          <span className="text-xs font-medium text-gray-500">
                            {format(
                              new Date(`${concert.date}T${concert.time}`),
                              "d MMM yyyy",
                              { locale: fr },
                            )}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(
                              new Date(`${concert.date}T${concert.time}`),
                              "HH'h'mm",
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

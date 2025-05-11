"use client";

import { ActivityFeed } from "@/components/ActivityFeed";
import { DashboardWelcomeHeader } from "@/components/DashboardWelcomeUser";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Concert } from "@/types/concerts";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Music, Music2, Users, Users2 } from "lucide-react";
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

// Add this loading skeleton component
function GroupRowSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-3">
      <Skeleton className="h-6 w-6 rounded-full" />
      <Skeleton className="h-4 w-[150px] rounded-full" />
    </div>
  );
}

function UserRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px] rounded-full" />
        <Skeleton className="h-3 w-[200px] rounded-full" />
      </div>
    </div>
  );
}

function ConcertRowSkeleton() {
  return (
    <div className="flex flex-col space-y-2 p-3">
      <Skeleton className="h-4 w-[180px] rounded-full" />
      <Skeleton className="h-3 w-[150px] rounded-full" />
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
        setConcerts(data.slice(0, 5)); // Get only the 5 next concerts
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
    <>
      <div className="container px-4 sm:px-6 lg:px-8 py-8">
        <DashboardWelcomeHeader />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="backdrop-blur-xl bg-white/50 dark:bg-black/50 border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-6 w-[200px]" />
                    ) : (
                      <h3 className="text-lg font-semibold">
                        Utilisateurs{" "}
                        <span className="text-sm text-muted-foreground">
                          ({totalUsers})
                        </span>
                      </h3>
                    )}
                  </div>
                </div>
                <Link href={RouteNames.DASHBOARD.ADMIN.USERS}>
                  <Button
                    variant="ghost"
                    className="rounded-full hover:bg-primary/10"
                  >
                    Voir détails
                  </Button>
                </Link>
              </div>

              <div className="mx-4">
                {isLoading ? (
                  <div className="">
                    {[...Array(5)].map((_, index) => (
                      <UserRowSkeleton key={index} />
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Aucun utilisateur trouvé
                  </p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-4 p-2"
                    >
                      <Avatar>
                        <AvatarFallback className="bg-primary/10">
                          {getInitials(user.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {user.display_name || "Utilisateur sans nom"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Current Program Card */}
          {/* Program Card */}
          <Card className="backdrop-blur-xl bg-white/50 dark:bg-black/50 border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Music className="size-5 text-primary" />
                  </div>
                  <div>
                    {isLoadingProgram ? (
                      <Skeleton className="h-6 w-[200px]" />
                    ) : (
                      <h3 className="text-lg font-semibold">
                        Programme en cours
                        <span className="text-sm text-muted-foreground ml-2">
                          ({groups.length} groupes)
                        </span>
                      </h3>
                    )}
                  </div>
                </div>
                <Link href={`/dashboard/travail/${program?.id}`}>
                  <Button
                    variant="ghost"
                    className="rounded-full hover:bg-primary/10"
                  >
                    Gérer
                  </Button>
                </Link>
              </div>

              <div className="space-y-1">
                {isLoadingProgram ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, index) => (
                      <GroupRowSkeleton key={index} />
                    ))}
                  </div>
                ) : groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Music2 className="h-12 w-12 text-primary/30 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Aucun groupe trouvé
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {groups.map((group) => (
                      <Link
                        key={group.id}
                        href={`/dashboard/travail/${program?.id}/${group.slug}`}
                      >
                        <div className="flex items-center space-x-3 p-3 hover:bg-primary/5 rounded-xl transition-colors">
                          <div className="p-2 bg-primary/10 rounded-full">
                            {group.name.toLowerCase().includes("choeur") ? (
                              <Users2 className="h-4 w-4 text-primary" />
                            ) : (
                              <Music2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {group.name}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Concerts Card */}
          <Card className="backdrop-blur-xl bg-white/50 dark:bg-black/50 border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Calendar className="size-5 text-primary" />
                  </div>
                  <div>
                    {isLoadingConcerts ? (
                      <Skeleton className="h-6 w-[200px]" />
                    ) : (
                      <h3 className="text-lg font-semibold">
                        Prochains concerts
                        <span className="text-sm text-muted-foreground ml-2">
                          ({concerts.length})
                        </span>
                      </h3>
                    )}
                  </div>
                </div>
                <Link href={RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS}>
                  <Button
                    variant="ghost"
                    className="rounded-full hover:bg-primary/10"
                  >
                    Planifier
                  </Button>
                </Link>
              </div>

              <div className="space-y-1">
                {isLoadingConcerts ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, index) => (
                      <ConcertRowSkeleton key={index} />
                    ))}
                  </div>
                ) : concerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-primary/30 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Aucun concert planifié
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {concerts.map((concert) => (
                      <div
                        key={concert.id}
                        className="p-3 hover:bg-primary/5 rounded-xl transition-colors"
                      >
                        {concert.name && (
                          <p className="text-sm font-semibold mb-1">
                            {concert.name}
                          </p>
                        )}
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{concert.place}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(
                              new Date(`${concert.date}T${concert.time}`),
                              "d MMMM yyyy 'à' HH'h'mm",
                              { locale: fr },
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>

  );
}

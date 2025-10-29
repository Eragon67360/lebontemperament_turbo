"use client";

import { DashboardWelcomeHeader } from "@/components/DashboardWelcomeUser";
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
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 sm:mb-12">
        <DashboardWelcomeHeader />
      </div>

      {/* Main Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Users Card */}
        <Card className="group border-border/50 bg-card hover:shadow-primary/5 relative overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-xl p-3 transition-transform duration-300 group-hover:scale-110">
                  <Users className="text-primary h-5 w-5" />
                </div>
                <div className="space-y-1">
                  {isLoading ? (
                    <Skeleton className="h-6 w-40" />
                  ) : (
                    <>
                      <CardTitle className="text-lg font-semibold">
                        Utilisateurs
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {totalUsers} utilisateur{totalUsers !== 1 ? "s" : ""}{" "}
                        enregistré{totalUsers !== 1 ? "s" : ""}
                      </CardDescription>
                    </>
                  )}
                </div>
              </div>
              <Link href={RouteNames.DASHBOARD.ADMIN.USERS}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/10 h-8 rounded-lg"
                >
                  Voir tout
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <UserRowSkeleton key={index} />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="text-muted-foreground/30 mb-4 h-12 w-12" />
                <p className="text-muted-foreground text-sm">
                  Aucun utilisateur trouvé
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user, index) => (
                  <div
                    key={user.id}
                    className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-2 transition-colors"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-xs font-medium">
                        {getInitials(user.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {user.display_name || "Utilisateur sans nom"}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
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
        <Card className="group border-border/50 bg-card hover:shadow-primary/5 relative overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-xl p-3 transition-transform duration-300 group-hover:scale-110">
                  <Music className="text-primary h-5 w-5" />
                </div>
                <div className="space-y-1">
                  {isLoadingProgram ? (
                    <Skeleton className="h-6 w-40" />
                  ) : (
                    <>
                      <CardTitle className="text-lg font-semibold">
                        Programme en cours
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {groups.length} groupe{groups.length !== 1 ? "s" : ""}{" "}
                        actif{groups.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </>
                  )}
                </div>
              </div>
              {program && (
                <Link href={`/dashboard/travail/${program.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-primary/10 h-8 rounded-lg"
                  >
                    Gérer
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingProgram ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, index) => (
                  <GroupRowSkeleton key={index} />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Music2 className="text-muted-foreground/30 mb-4 h-12 w-12" />
                <p className="text-muted-foreground text-sm">
                  Aucun groupe trouvé
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/dashboard/travail/${program?.id}/${group.slug}`}
                    className="block"
                  >
                    <div className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-2.5 transition-colors">
                      <div className="bg-primary/10 rounded-lg p-1.5">
                        {group.name.toLowerCase().includes("choeur") ? (
                          <Users2 className="text-primary h-4 w-4" />
                        ) : (
                          <Music2 className="text-primary h-4 w-4" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{group.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Concerts Card */}
      <Card className="group border-border/50 bg-card hover:shadow-primary/5 relative overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-xl p-3 transition-transform duration-300 group-hover:scale-110">
                <Calendar className="text-primary h-5 w-5" />
              </div>
              <div className="space-y-1">
                {isLoadingConcerts ? (
                  <Skeleton className="h-6 w-48" />
                ) : (
                  <>
                    <CardTitle className="text-lg font-semibold">
                      Prochains concerts
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {concerts.length} concert
                      {concerts.length !== 1 ? "s" : ""} à venir
                    </CardDescription>
                  </>
                )}
              </div>
            </div>
            <Link href={RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS}>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-primary/10 h-8 rounded-lg"
              >
                Planifier
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingConcerts ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <ConcertRowSkeleton key={index} />
              ))}
            </div>
          ) : concerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="text-muted-foreground/30 mb-4 h-12 w-12" />
              <p className="text-muted-foreground text-sm font-medium">
                Aucun concert planifié
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {concerts.map((concert) => (
                <div
                  key={concert.id}
                  className="group/concert border-border/50 bg-muted/30 hover:border-primary/50 hover:bg-muted/50 rounded-lg border p-4 transition-all duration-200"
                >
                  {concert.name && (
                    <p className="mb-2 text-sm leading-tight font-semibold">
                      {concert.name}
                    </p>
                  )}
                  <div className="space-y-1.5">
                    <p className="text-sm leading-tight font-medium">
                      {concert.place}
                    </p>
                    <p className="text-muted-foreground text-xs">
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
        </CardContent>
      </Card>
    </div>
  );
}

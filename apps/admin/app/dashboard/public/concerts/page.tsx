// app/dashboard/public/concerts/page.tsx
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RouteNames from "@/utils/routes";
import { Archive, Calendar } from "lucide-react";
import Link from "next/link";

export default function ConcertsPage() {
  return (
    <div className="container px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <DashboardPageHeader
        title="Gestion des Concerts"
        description="Gérez les concerts à venir et consultez les archives."
      />

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Concerts Card */}
        <Link href={RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS}>
          <Card className="cursor-pointer overflow-hidden rounded-2xl border-0 bg-white/50 shadow-lg backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-xl dark:bg-black/50">
            <CardHeader className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Calendar className="text-primary h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    Prochains Concerts
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Gérez les concerts à venir et leur programmation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Projects Card */}
        <Link href={RouteNames.DASHBOARD.PUBLIC.PROJETS.ROOT}>
          <Card className="cursor-pointer overflow-hidden rounded-2xl border-0 bg-white/50 shadow-lg backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-xl dark:bg-black/50">
            <CardHeader className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Archive className="text-primary h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    Projets
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Consultez et gérez les projets ainsi que leur page dédiée
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

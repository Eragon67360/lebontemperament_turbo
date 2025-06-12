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
    <div className="container px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <DashboardPageHeader
        title="Gestion des Concerts"
        description="Gérez les concerts à venir et consultez les archives."
      />

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Concerts Card */}
        <Link href={RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS}>
          <Card className="backdrop-blur-xl bg-white/50 dark:bg-black/50 border-0 shadow-lg rounded-2xl overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all duration-200 cursor-pointer">
            <CardHeader className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    Prochains Concerts
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Gérez les concerts à venir et leur programmation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Projects Card */}
        <Link href={RouteNames.DASHBOARD.PUBLIC.PROJETS.ROOT}>
          <Card className="backdrop-blur-xl bg-white/50 dark:bg-black/50 border-0 shadow-lg rounded-2xl overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all duration-200 cursor-pointer">
            <CardHeader className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Archive className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    Projets
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
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

// app/dashboard/public/concerts/page.tsx
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RouteNames from "@/utils/routes";
import { ArrowRight, Calendar, Music } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";

export default function ConcertsPage() {
  return (
    <PageShell
      theme="public"
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Concerts & Projets"
      description="Gérez les concerts à venir et les projets artistiques."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Link href={RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS}>
          <Card className="group hover:border-primary/50 border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
            <CardHeader>
              <div className="bg-primary/10 text-primary group-hover:bg-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-colors group-hover:text-white">
                <Calendar className="h-6 w-6" />
              </div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                Prochains Concerts
                <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Gérez la liste des concerts à venir, les dates, lieux et
                programmes.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={RouteNames.DASHBOARD.PUBLIC.PROJETS.ROOT}>
          <Card className="group hover:border-primary/50 border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
            <CardHeader>
              <div className="bg-primary/10 text-primary group-hover:bg-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-colors group-hover:text-white">
                <Music className="h-6 w-6" />
              </div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                Projets
                <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Créez et modifiez les projets artistiques, ajoutez des
                descriptions et des médias.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </PageShell>
  );
}

import { PageShell } from "@/components/layouts/PageShell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/data-state";
import type { Program } from "@/types/work";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/server";
import { FolderOpen } from "lucide-react";
import Link from "next/link";

/**
 * Lists the work programs that actually exist, instead of the four hardcoded
 * cards this page used to show — those pointed at /dashboard/travail/*, a route
 * tree that was moved under /dashboard/members and left every card a dead link.
 */
export default async function TravailPage() {
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("programs")
    .select("*")
    .order("start_date", { ascending: false });

  return (
    <PageShell
      theme="members"
      title="Espace de travail"
      description="Partitions et ressources pédagogiques, par programme."
    >
      {programs?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {programs.map((program: Program) => (
            <Link
              key={program.id}
              href={`${RouteNames.DASHBOARD.MEMBERS.TRAVAIL_ROOT}/${program.id}`}
              className="group focus-visible:ring-ring rounded-2xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Card className="h-full transition-shadow duration-150 ease-out group-hover:shadow-md motion-reduce:transition-none">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <FolderOpen
                      className="text-primary h-7 w-7 shrink-0"
                      aria-hidden
                    />
                    {program.is_active && <Badge>En cours</Badge>}
                  </div>
                  <CardTitle className="text-base">{program.name}</CardTitle>
                  <CardDescription>
                    {formatSeason(program.start_date, program.end_date)}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="Aucun programme"
          description="Les programmes de travail apparaîtront ici dès qu'un premier aura été créé."
        />
      )}
    </PageShell>
  );
}

function formatSeason(start: string, end: string) {
  const format = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return `${format.format(new Date(start))} – ${format.format(new Date(end))}`;
}

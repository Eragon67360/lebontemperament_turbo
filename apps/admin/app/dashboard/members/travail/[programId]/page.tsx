import { PageShell } from "@/components/layouts/PageShell";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/data-state";
import type { WorkGroup } from "@/types/work";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/server";
import { Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function WorkProgramPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const supabase = await createClient();
  const { programId } = await params;

  const [{ data: program }, { data: groups }] = await Promise.all([
    supabase.from("programs").select("*").eq("id", programId).single(),
    supabase.from("groups").select("*").order("order_index"),
  ]);

  // A missing program is a bad URL, not a rendering problem: let the app's
  // not-found page handle it instead of printing "Not found" inside the shell.
  if (!program) notFound();

  return (
    <PageShell
      theme="members"
      title={program.name}
      description="Choisissez un groupe pour accéder à ses documents."
    >
      {groups?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group: WorkGroup) => (
            <Link
              key={group.id}
              // The /members segment was missing here, so every group card 404'd.
              href={`${RouteNames.DASHBOARD.MEMBERS.TRAVAIL_ROOT}/${programId}/${group.slug}`}
              className="group focus-visible:ring-ring rounded-2xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Card className="h-full transition-shadow duration-150 ease-out group-hover:shadow-md motion-reduce:transition-none">
                <CardHeader>
                  <Users className="text-primary mb-2 h-7 w-7" aria-hidden />
                  <CardTitle className="text-base">{group.name}</CardTitle>
                  {group.description && (
                    <CardDescription>{group.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Aucun groupe"
          description="Aucun groupe n'est configuré pour le moment."
        />
      )}
    </PageShell>
  );
}

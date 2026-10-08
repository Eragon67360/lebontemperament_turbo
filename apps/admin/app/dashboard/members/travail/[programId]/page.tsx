import { PageShell } from "@/components/layouts/PageShell";
import { DriveProgramView } from "@/components/travail/DriveIndexViews";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/data-state";
import { GROUP_COLUMNS, PROGRAM_COLUMNS } from "@/lib/columns";
import type { WorkGroup } from "@/types/work";
import { isLegacyProgramId } from "@/utils/drive/tree";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/server";
import { isDriveId } from "@repo/domain/utils/driveScope";
import { Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * `[programId]` is a Drive folder ID (a programme of the Drive index) or, for
 * the old Storage explorer, a `programs` row's UUID: the URL shape stays the
 * same and the segment's shape picks the screen (`isLegacyProgramId`).
 */
export default async function WorkProgramPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  if (!isLegacyProgramId(programId)) {
    if (!isDriveId(programId)) notFound();
    return <DriveProgramView programId={programId} />;
  }
  return <LegacyProgramPage programId={programId} />;
}

/** The old « Espace de travail » (Storage): a programme's groups. */
async function LegacyProgramPage({ programId }: { programId: string }) {
  const supabase = await createClient();

  const [{ data: program }, { data: groups, error: groupsError }] =
    await Promise.all([
      supabase
        .from("programs")
        .select(PROGRAM_COLUMNS)
        .eq("id", programId)
        .single(),
      supabase.from("groups").select(GROUP_COLUMNS).order("order_index"),
    ]);

  // A missing program is a bad URL, not a rendering problem: let the app's
  // not-found page handle it instead of printing "Not found" inside the shell.
  if (!program) notFound();
  // A failed groups query is neither: it must not read as "aucun groupe".
  if (groupsError) throw groupsError;

  return (
    <PageShell
      theme="members"
      title={program.name}
      description="Anciens fichiers (stockage), jamais visibles des membres : choisissez un groupe."
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

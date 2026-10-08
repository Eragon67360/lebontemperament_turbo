import { FileExplorer } from "@/components/FileExplorer";
import { PageShell } from "@/components/layouts/PageShell";
import { DriveGroupView } from "@/components/travail/DriveIndexViews";
import { GROUP_COLUMNS, PROGRAM_COLUMNS } from "@/lib/columns";
import { isLegacyProgramId } from "@/utils/drive/tree";
import { createClient } from "@/utils/supabase/server";
import { isDriveId } from "@repo/domain/utils/driveScope";
import { notFound } from "next/navigation";

/**
 * Under a Drive programme, `[groupSlug]` is the group folder's Drive ID; under
 * an old Storage programme (UUID), it is still the `groups` row's slug.
 */
export default async function WorkPage({
  params,
}: {
  params: Promise<{ programId: string; groupSlug: string }>;
}) {
  const { programId, groupSlug } = await params;
  if (!isLegacyProgramId(programId)) {
    if (!isDriveId(programId) || !isDriveId(groupSlug)) notFound();
    return <DriveGroupView programId={programId} groupId={groupSlug} />;
  }
  return <LegacyGroupPage programId={programId} groupSlug={groupSlug} />;
}

/** The old « Espace de travail » (Storage) explorer of one group. */
async function LegacyGroupPage({
  programId,
  groupSlug,
}: {
  programId: string;
  groupSlug: string;
}) {
  const supabase = await createClient();

  const [{ data: program }, { data: group }] = await Promise.all([
    supabase
      .from("programs")
      .select(PROGRAM_COLUMNS)
      .eq("id", programId)
      .single(),
    supabase
      .from("groups")
      .select(GROUP_COLUMNS)
      .eq("slug", groupSlug)
      .single(),
  ]);

  if (!program || !group) notFound();

  return (
    <PageShell
      theme="members"
      title={group.name}
      description={`Anciens fichiers (stockage) du programme ${program.name}, jamais visibles des membres.`}
    >
      <FileExplorer programId={program.id} groupId={group.id} />
    </PageShell>
  );
}

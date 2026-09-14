import { FileExplorer } from "@/components/FileExplorer";
import { PageShell } from "@/components/layouts/PageShell";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ programId: string; groupSlug: string }>;
}) {
  const { programId, groupSlug } = await params;
  const supabase = await createClient();

  const [{ data: program }, { data: group }] = await Promise.all([
    supabase.from("programs").select("*").eq("id", programId).single(),
    supabase.from("groups").select("*").eq("slug", groupSlug).single(),
  ]);

  if (!program || !group) notFound();

  return (
    <PageShell
      theme="members"
      title={group.name}
      description={`Documents du programme ${program.name}.`}
    >
      <FileExplorer programId={program.id} groupId={group.id} />
    </PageShell>
  );
}

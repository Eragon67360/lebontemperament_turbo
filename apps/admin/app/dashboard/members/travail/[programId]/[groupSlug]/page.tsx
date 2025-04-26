// app/dashboard/travail/[programId]/[groupSlug]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { FileExplorer } from "@/components/FileExplorer";
import { notFound } from "next/navigation";

interface WorkPageProps {
  programId: string;
  groupSlug: string;
}

export default async function WorkPage({
  params,
}: {
  params: Promise<WorkPageProps>;
}) {
  const { programId, groupSlug } = await params;
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", programId)
    .single();

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("slug", groupSlug)
    .single();

  if (!program || !group) {
    return notFound();
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-8">
        {program.name} - {group.name}
      </h1>
      <FileExplorer programId={program.id} groupId={group.id} />
    </div>
  );
}

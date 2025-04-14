// utils/programs.ts
import { createClient } from "@/utils/supabase/server";

export async function getProgramName(
  programId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("programs")
    .select("name")
    .eq("id", programId)
    .single();

  return data?.name || null;
}

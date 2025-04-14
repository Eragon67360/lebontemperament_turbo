// utils/navigation.ts
import { WorkNavigation } from "@/types/work";
import { createClient } from "@/utils/supabase/client";

export async function fetchWorkNavigation(): Promise<WorkNavigation> {
  const supabase = createClient();

  // Get active program
  const { data: activeProgram } = await supabase
    .from("programs")
    .select("*")
    .eq("is_active", true)
    .single();

  // Get all programs for switching
  const { data: programs } = await supabase
    .from("programs")
    .select("*")
    .order("start_date", { ascending: false });

  // Get all groups
  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("order_index");

  return {
    activeProgram: activeProgram || null,
    programs: programs || [],
    groups: groups || [],
  };
}

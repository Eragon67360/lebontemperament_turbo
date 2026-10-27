import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { REHEARSAL_COLUMNS, type PublicRehearsal } from "./publicConcerts";

/**
 * The next rehearsal on the public agenda (/concerts): the first one on or
 * after `today` (the Paris day, YYYY-MM-DD), its date only. The rehearsals
 * table is for signed-in members, so the page reads this one row on the server
 * with the service-role client and never with the public key.
 *
 * `client` creates that client. It is called here so that a missing key, like
 * a failed read, only leaves the agenda without the line: the rest of the page
 * renders as usual.
 */
export async function loadNextRehearsal(
  client: () => SupabaseClient<Database>,
  today: string,
): Promise<PublicRehearsal[]> {
  try {
    const { data, error } = await client()
      .from("rehearsals")
      .select(REHEARSAL_COLUMNS)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(1);
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Error loading the next rehearsal:", error);
    return [];
  }
}

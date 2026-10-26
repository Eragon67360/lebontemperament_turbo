import type { Memory } from "@/types/anniversary";
import type { Database } from "@repo/domain/database.types";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

/**
 * The columns of `anniversary_memories` a visitor may see. The author's
 * `email` is for the admin's moderation screens only and must never reach
 * the website's payload: every public read goes through this list and
 * `toPublicMemory`, and `lib/anniversaryMemories.test.ts` guards it.
 */
export const PUBLIC_MEMORY_SELECT =
  "id, name, message, year, is_featured, created_at" as const;

export const PUBLIC_MEMORY_COLUMNS: readonly string[] =
  PUBLIC_MEMORY_SELECT.split(",").map((column) => column.trim());

/** Featured memories shown on `/40-ans`, newest first. */
export const FEATURED_MEMORIES_LIMIT = 10;

/** A row as the public select returns it (nullable flags come from the DB). */
export type PublicMemoryRow = {
  id: string;
  name: string;
  message: string;
  year: number | null;
  is_featured: boolean | null;
  created_at: string | null;
};

/**
 * Builds the view-model from a row, picking the public columns explicitly:
 * whatever else a row carries (an email, a moderation flag) is dropped here.
 */
export function toPublicMemory(row: PublicMemoryRow): Memory {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    year: row.year,
    is_featured: row.is_featured ?? false,
    created_at: row.created_at ?? "",
  };
}

/** What the form on /40-ans sends (presence and e-mail checked by the route). */
export type MemorySubmission = {
  name: string;
  email: string;
  message: string;
  /** The year the memory is about, as typed in the form, or nothing. */
  year?: string | number | null;
};

/** The row the form stores: id chosen by the server, text trimmed, pending. */
export type PendingMemoryRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  year: number | null;
  is_approved: false;
  is_featured: false;
};

/** The year as a whole number, or null when empty or not a number. */
export function parseMemoryYear(
  value: MemorySubmission["year"],
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const year = Number.parseInt(String(value), 10);
  return Number.isNaN(year) ? null : year;
}

/**
 * Builds the row a submission becomes. The id is chosen here, not read back
 * from the database: visitors and members may insert a memory but have no
 * SELECT policy on `anniversary_memories`, so the insert must not return the
 * row (see `insertPendingMemory`). A new memory always starts pending,
 * whatever the form sends; the admin approves it (#743).
 */
export function pendingMemoryRow(
  submission: MemorySubmission,
): PendingMemoryRow {
  return {
    id: crypto.randomUUID(),
    name: submission.name.trim(),
    email: submission.email.trim().toLowerCase(),
    message: submission.message.trim(),
    year: parseMemoryYear(submission.year),
    is_approved: false,
    is_featured: false,
  };
}

/**
 * Stores a memory with the visitor's own session (anonymous or member).
 * Deliberately no `.select()` after the insert: the session may insert but
 * not read the table, and an insert that returns the row is refused as a
 * whole. The caller already knows the id from `pendingMemoryRow`.
 */
export async function insertPendingMemory(
  supabase: SupabaseClient<Database>,
  memory: PendingMemoryRow,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.from("anniversary_memories").insert(memory);
  return { error };
}

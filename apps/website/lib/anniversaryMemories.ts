import type { Memory } from "@/types/anniversary";

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

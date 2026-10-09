import { listRehearsalSlots } from "@/lib/joining";
import { createPublicClient } from "@/utils/supabase/public";
import { NextResponse } from "next/server";

// Same for every visitor (anon key): prerendered, refreshed every five
// minutes or when the admin saves a rehearsal time (/api/revalidate).
export const revalidate = 300;

/**
 * GET /api/joining — the usual rehearsal times of /rejoindre, in the
 * admin's order: `{ slots: [{ group, day, time, place, rhythm }] }`. The
 * app's « Nous rejoindre » screen reads it; while the table is missing or
 * empty, the list in code.
 */
export async function GET() {
  const slots = await listRehearsalSlots(createPublicClient());
  return NextResponse.json({ slots });
}

// app/api/events/route.ts
import { withEventDocuments } from "@/lib/eventDocuments";
import { EVENT_COLUMNS } from "@/lib/publicConcerts";
import { createClient } from "@/utils/supabase/server";
import type { Event, EventWithDocuments } from "@repo/domain/types/events";
import { parisToday } from "@repo/domain/utils/parisDay";
import { NextResponse } from "next/server";

/**
 * Events not over yet (a one-day event has no `date_to`), each with its
 * files (`documents`, empty when none).
 */
export async function GET() {
  const supabase = await createClient();
  const today = parisToday();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .order("date_from", { ascending: true })
    .or(`date_to.gte.${today},and(date_to.is.null,date_from.gte.${today})`);

  if (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  // view-model: narrows event_type from string to the 5-value union
  const events: EventWithDocuments[] = await withEventDocuments(
    supabase,
    (data || []) as Event[],
  );
  return NextResponse.json(events);
}

// app/api/events/route.ts
import { EVENT_COLUMNS } from "@/lib/publicConcerts";
import { createClient } from "@/utils/supabase/server";
import { Event } from "@repo/domain/types/events";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .order("date_from", { ascending: true })
    .gte("date_to", new Date().toISOString().split("T")[0]);

  if (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json((data || []) as Event[]); // view-model: narrows event_type from string to the 5-value union
}

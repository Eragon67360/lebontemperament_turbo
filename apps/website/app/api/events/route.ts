// app/api/events/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date_from", { ascending: true })
    .gte("date_to", new Date().toISOString().split("T")[0]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

import { CONCERT_COLUMNS } from "@/lib/publicConcerts";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Read-only: concerts are created, edited and deleted from the admin app.
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("concerts")
    .select(CONCERT_COLUMNS)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching concerts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json(data);
}

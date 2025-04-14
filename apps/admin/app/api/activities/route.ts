// app/api/activities/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "15");

    const { data, error } = await supabase
      .from("activities")
      .select(
        `
        *,
        profiles!activities_user_id_fkey (
          email,
          display_name
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des activités" },
      { status: 500 }
    );
  }
}

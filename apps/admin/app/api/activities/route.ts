// app/api/activities/route.ts
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const requested = parseInt(searchParams.get("limit") || "15", 10);
    const limit = Number.isNaN(requested)
      ? 15
      : Math.min(Math.max(requested, 1), 100);

    // `targetId`: the history of one account (the member page).
    const targetId = searchParams.get("targetId");
    if (targetId !== null && !UUID.test(targetId)) {
      return NextResponse.json({ error: "targetId invalide" }, { status: 400 });
    }

    let query = supabase
      .from("activities")
      .select(
        `
        *,
        profiles!activities_user_id_fkey (
          email,
          display_name
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (targetId) query = query.eq("target_id", targetId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des activités" },
      { status: 500 },
    );
  }
}

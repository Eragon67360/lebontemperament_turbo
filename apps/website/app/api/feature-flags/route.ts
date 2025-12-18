// app/api/feature-flags/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const flagKey = searchParams.get("flag_key");

  if (!flagKey) {
    return NextResponse.json(
      { error: "flag_key parameter is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("feature_flags")
    .select("is_enabled")
    .eq("flag_key", flagKey)
    .single();

  if (error) {
    console.error("Error fetching feature flag:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

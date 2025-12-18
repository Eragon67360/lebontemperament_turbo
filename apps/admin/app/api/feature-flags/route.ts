// app/api/feature-flags/route.ts
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch feature flag(s)
export async function GET(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const flagKey = searchParams.get("flag_key");

    const supabase = await createClient();

    if (flagKey) {
      // Fetch single feature flag
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .eq("flag_key", flagKey)
        .single();

      if (error) {
        console.error("Error fetching feature flag:", error);
        return NextResponse.json(
          { error: "Failed to fetch feature flag" },
          { status: 500 },
        );
      }

      return NextResponse.json(data);
    } else {
      // Fetch all feature flags
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching feature flags:", error);
        return NextResponse.json(
          { error: "Failed to fetch feature flags" },
          { status: 500 },
        );
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("Error in GET /api/feature-flags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update feature flag
export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { flag_key, is_enabled } = body;

    if (!flag_key || typeof is_enabled !== "boolean") {
      return NextResponse.json(
        { error: "flag_key and is_enabled are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("feature_flags")
      .update({ is_enabled })
      .eq("flag_key", flag_key)
      .select()
      .single();

    if (error) {
      console.error("Error updating feature flag:", error);
      return NextResponse.json(
        { error: "Failed to update feature flag" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/feature-flags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

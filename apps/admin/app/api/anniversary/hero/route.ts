import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch hero content (singleton)
export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_hero")
      .select("*")
      .single();

    if (error) {
      console.error("Error fetching hero:", error);
      return NextResponse.json(
        { error: "Failed to fetch hero content" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/anniversary/hero:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update hero content
export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();

    const supabase = await createClient();

    // First, get the existing row ID
    const { data: existingRow } = await supabase
      .from("anniversary_hero")
      .select("id")
      .single();

    if (!existingRow) {
      return NextResponse.json(
        { error: "Hero content not found" },
        { status: 404 },
      );
    }

    // Update the singleton row using its ID
    const { data, error } = await supabase
      .from("anniversary_hero")
      .update(body)
      .eq("id", existingRow.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating hero:", error);
      return NextResponse.json(
        { error: "Failed to update hero content" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/anniversary/hero:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

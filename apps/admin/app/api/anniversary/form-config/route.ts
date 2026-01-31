import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch form config (singleton)
export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_form_config")
      .select("*")
      .single();

    if (error) {
      console.error("Error fetching form config:", error);
      return NextResponse.json(
        { error: "Failed to fetch form config" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/anniversary/form-config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update form config
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
      .from("anniversary_form_config")
      .select("id")
      .single();

    if (!existingRow) {
      return NextResponse.json(
        { error: "Form config not found" },
        { status: 404 },
      );
    }

    // Update the singleton row using its ID
    const { data, error } = await supabase
      .from("anniversary_form_config")
      .update(body)
      .eq("id", existingRow.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating form config:", error);
      return NextResponse.json(
        { error: "Failed to update form config" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/anniversary/form-config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

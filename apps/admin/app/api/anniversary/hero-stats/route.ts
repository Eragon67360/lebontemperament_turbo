import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Helper to check authorization

// GET - Fetch all hero stats
export async function GET() {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("anniversary_hero_stats")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching hero stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST - Create new hero stat
export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const supabase = await createClient();

  try {
    const body = await request.json();

    // Validation
    if (!body.icon_name || !body.number || !body.label) {
      return NextResponse.json(
        { error: "Missing required fields: icon_name, number, label" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("anniversary_hero_stats")
      .insert({
        icon_name: body.icon_name,
        number: body.number,
        label: body.label,
        display_order: body.display_order || 0,
        is_visible: body.is_visible !== undefined ? body.is_visible : true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating hero stat:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error parsing request:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

// PATCH - Update hero stat
export async function PATCH(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing hero stat ID" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("anniversary_hero_stats")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating hero stat:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error parsing request:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

// DELETE - Delete hero stat
export async function DELETE(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const supabase = await createClient();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing hero stat ID" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("anniversary_hero_stats")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting hero stat:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error parsing request:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

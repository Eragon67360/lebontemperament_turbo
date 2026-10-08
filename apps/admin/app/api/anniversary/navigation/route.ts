import { ANNIVERSARY_NAVIGATION_CARD_COLUMNS } from "@/lib/columns";
import {
  navigationCardPatchSchema,
  parsePatchBody,
  readJson,
} from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch all navigation cards
export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_navigation_cards")
      .select(ANNIVERSARY_NAVIGATION_CARD_COLUMNS)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching navigation cards:", error);
      return NextResponse.json(
        { error: "Failed to fetch navigation cards" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/anniversary/navigation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new navigation card
export async function POST(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();

    if (!body.title || !body.description || !body.icon_name) {
      return NextResponse.json(
        { error: "title, description, and icon_name are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_navigation_cards")
      .insert(body)
      .select(ANNIVERSARY_NAVIGATION_CARD_COLUMNS)
      .single();

    if (error) {
      console.error("Error creating navigation card:", error);
      return NextResponse.json(
        { error: "Failed to create navigation card" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in POST /api/anniversary/navigation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update navigation card
export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Only the columns the dialog, the visibility toggle and the reorder
    // send; anything else is refused (#471).
    const parsed = parsePatchBody(
      navigationCardPatchSchema,
      await readJson(request),
    );
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status },
      );
    }
    const { id, ...updates } = parsed.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_navigation_cards")
      .update(updates)
      .eq("id", id)
      .select(ANNIVERSARY_NAVIGATION_CARD_COLUMNS)
      .single();

    if (error) {
      console.error("Error updating navigation card:", error);
      return NextResponse.json(
        { error: "Failed to update navigation card" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/anniversary/navigation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete navigation card
export async function DELETE(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("anniversary_navigation_cards")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting navigation card:", error);
      return NextResponse.json(
        { error: "Failed to delete navigation card" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/anniversary/navigation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

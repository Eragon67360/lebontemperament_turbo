import { ANNIVERSARY_MEMORY_COLUMNS } from "@/lib/columns";
import {
  memoryPatchSchema,
  parsePatchBody,
  readJson,
} from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch all memories (for moderation)
export async function GET(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // 'approved', 'pending', 'all'

    const supabase = await createClient();
    let query = supabase
      .from("anniversary_memories")
      .select(ANNIVERSARY_MEMORY_COLUMNS)
      .order("created_at", { ascending: false });

    // Filter by approval status
    if (status === "approved") {
      query = query.eq("is_approved", true);
    } else if (status === "pending") {
      query = query.eq("is_approved", false);
    }
    // 'all' means no filter

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching memories:", error);
      return NextResponse.json(
        { error: "Failed to fetch memories" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/anniversary/memories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update memory (approve/feature)
export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Moderation flags only; the visitor's text is never rewritten (#471).
    const parsed = parsePatchBody(memoryPatchSchema, await readJson(request));
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status },
      );
    }
    const { id, ...updates } = parsed.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_memories")
      .update(updates)
      .eq("id", id)
      .select(ANNIVERSARY_MEMORY_COLUMNS)
      .single();

    if (error) {
      console.error("Error updating memory:", error);
      return NextResponse.json(
        { error: "Failed to update memory" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/anniversary/memories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete memory
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
      .from("anniversary_memories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting memory:", error);
      return NextResponse.json(
        { error: "Failed to delete memory" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/anniversary/memories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

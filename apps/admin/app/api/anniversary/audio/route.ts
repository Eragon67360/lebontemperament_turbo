import { cloudinary } from "@/lib/cloudinary";
import { ANNIVERSARY_AUDIO_MEMORY_COLUMNS } from "@/lib/columns";
import {
  audioMemoryPatchSchema,
  parsePatchBody,
  readJson,
} from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch all audio memories
export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_audio_memories")
      .select(ANNIVERSARY_AUDIO_MEMORY_COLUMNS)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching audio memories:", error);
      return NextResponse.json(
        { error: "Failed to fetch audio memories" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/anniversary/audio:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new audio memory
export async function POST(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();

    if (!body.title || !body.description || !body.duration || !body.audio_url) {
      return NextResponse.json(
        { error: "title, description, duration, and audio_url are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_audio_memories")
      .insert(body)
      .select(ANNIVERSARY_AUDIO_MEMORY_COLUMNS)
      .single();

    if (error) {
      console.error("Error creating audio memory:", error);
      return NextResponse.json(
        { error: "Failed to create audio memory" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in POST /api/anniversary/audio:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update audio memory
export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Only the columns the dialog, the visibility toggle and the reorder
    // send; anything else is refused (#471).
    const parsed = parsePatchBody(
      audioMemoryPatchSchema,
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
      .from("anniversary_audio_memories")
      .update(updates)
      .eq("id", id)
      .select(ANNIVERSARY_AUDIO_MEMORY_COLUMNS)
      .single();

    if (error) {
      console.error("Error updating audio memory:", error);
      return NextResponse.json(
        { error: "Failed to update audio memory" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/anniversary/audio:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete audio memory
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

    // First, get the audio record to retrieve the audio_url (public_id)
    const { data: audioRecord, error: fetchError } = await supabase
      .from("anniversary_audio_memories")
      .select("audio_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching audio memory:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch audio memory" },
        { status: 500 },
      );
    }

    // Delete from Cloudinary if audio_url exists
    if (audioRecord?.audio_url) {
      try {
        await cloudinary.uploader.destroy(audioRecord.audio_url, {
          resource_type: "raw", // Audio files are stored as 'raw' in Cloudinary
        });
        console.log("Deleted audio from Cloudinary:", audioRecord.audio_url);
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    const { error } = await supabase
      .from("anniversary_audio_memories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting audio memory:", error);
      return NextResponse.json(
        { error: "Failed to delete audio memory" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/anniversary/audio:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

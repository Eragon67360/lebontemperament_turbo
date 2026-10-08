import { cloudinary } from "@/lib/cloudinary";
import { ANNIVERSARY_VIDEO_COLUMNS } from "@/lib/columns";
import {
  parsePatchBody,
  readJson,
  videoPatchSchema,
} from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch all videos
export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_videos")
      .select(ANNIVERSARY_VIDEO_COLUMNS)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching videos:", error);
      return NextResponse.json(
        { error: "Failed to fetch videos" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/anniversary/videos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new video
export async function POST(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();

    if (
      !body.title ||
      !body.description ||
      !body.thumbnail_url ||
      !body.category
    ) {
      return NextResponse.json(
        {
          error: "title, description, thumbnail_url, and category are required",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_videos")
      .insert(body)
      .select(ANNIVERSARY_VIDEO_COLUMNS)
      .single();

    if (error) {
      console.error("Error creating video:", error);
      return NextResponse.json(
        { error: "Failed to create video" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in POST /api/anniversary/videos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update video
export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Only the columns the dialog, the visibility toggle and the reorder
    // send; anything else is refused (#471).
    const parsed = parsePatchBody(videoPatchSchema, await readJson(request));
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status },
      );
    }
    const { id, ...updates } = parsed.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_videos")
      .update(updates)
      .eq("id", id)
      .select(ANNIVERSARY_VIDEO_COLUMNS)
      .single();

    if (error) {
      console.error("Error updating video:", error);
      return NextResponse.json(
        { error: "Failed to update video" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/anniversary/videos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete video
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

    // First, get the video record to retrieve the thumbnail_url (public_id)
    const { data: videoRecord, error: fetchError } = await supabase
      .from("anniversary_videos")
      .select("thumbnail_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching video:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch video" },
        { status: 500 },
      );
    }

    // Delete thumbnail from Cloudinary if thumbnail_url exists
    if (videoRecord?.thumbnail_url) {
      try {
        await cloudinary.uploader.destroy(videoRecord.thumbnail_url, {
          resource_type: "image",
        });
        console.log(
          "Deleted thumbnail from Cloudinary:",
          videoRecord.thumbnail_url,
        );
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    const { error } = await supabase
      .from("anniversary_videos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting video:", error);
      return NextResponse.json(
        { error: "Failed to delete video" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/anniversary/videos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

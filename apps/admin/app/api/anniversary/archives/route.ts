import { cloudinary } from "@/lib/cloudinary";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch all archives
export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_archives")
      .select("*")
      .order("year", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching archives:", error);
      return NextResponse.json(
        { error: "Failed to fetch archives" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/anniversary/archives:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new archive
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
      !body.year ||
      !body.type ||
      !body.theme ||
      !body.file_url ||
      !body.file_size
    ) {
      return NextResponse.json(
        {
          error:
            "title, description, year, type, theme, file_url, and file_size are required",
        },
        { status: 400 },
      );
    }

    // Validate archive type
    const validTypes = [
      "assemblée-générale",
      "rapport-annuel",
      "rapport-financier",
      "gazette",
      "programme",
      "document-historique",
    ];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: "Invalid archive type" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_archives")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("Error creating archive:", error);
      return NextResponse.json(
        { error: "Failed to create archive" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in POST /api/anniversary/archives:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update archive
export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Validate archive type if provided
    if (updates.type) {
      const validTypes = [
        "assemblée-générale",
        "rapport-annuel",
        "rapport-financier",
        "gazette",
        "programme",
        "document-historique",
      ];
      if (!validTypes.includes(updates.type)) {
        return NextResponse.json(
          { error: "Invalid archive type" },
          { status: 400 },
        );
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversary_archives")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating archive:", error);
      return NextResponse.json(
        { error: "Failed to update archive" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/anniversary/archives:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete archive
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

    // First, get the archive record to retrieve the file_url (public_id)
    const { data: archiveRecord, error: fetchError } = await supabase
      .from("anniversary_archives")
      .select("file_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching archive:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch archive" },
        { status: 500 },
      );
    }

    // Delete from Cloudinary if file_url exists
    if (archiveRecord?.file_url) {
      try {
        await cloudinary.uploader.destroy(archiveRecord.file_url, {
          resource_type: "raw", // PDFs are stored as raw files
        });
        console.log("Deleted file from Cloudinary:", archiveRecord.file_url);
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    const { error } = await supabase
      .from("anniversary_archives")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting archive:", error);
      return NextResponse.json(
        { error: "Failed to delete archive" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/anniversary/archives:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

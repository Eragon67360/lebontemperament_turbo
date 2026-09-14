// app/api/drive-folders/route.ts
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { extractDriveFolderId } from "@repo/domain/utils/drive";
import { NextResponse } from "next/server";

// GET - Fetch the Drive folders shown on the members site
export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("drive_folders")
      .select("*")
      .order("display_order");

    if (error) {
      console.error("Error fetching drive folders:", error);
      return NextResponse.json(
        { error: "Failed to fetch drive folders" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/drive-folders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Retarget a folder (admins paste either an ID or a Drive URL)
export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, folder_id, label } = body;

    if (!id || typeof folder_id !== "string") {
      return NextResponse.json(
        { error: "id et folder_id sont requis" },
        { status: 400 },
      );
    }

    const folderId = extractDriveFolderId(folder_id);
    if (!folderId) {
      return NextResponse.json(
        { error: "Identifiant de dossier Drive invalide" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("drive_folders")
      .update({
        folder_id: folderId,
        ...(typeof label === "string" && label.trim()
          ? { label: label.trim() }
          : {}),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating drive folder:", error);
      return NextResponse.json(
        { error: "Failed to update drive folder" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/drive-folders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

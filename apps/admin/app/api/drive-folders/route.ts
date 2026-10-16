// app/api/drive-folders/route.ts
import { DRIVE_FOLDER_COLUMNS } from "@/lib/columns";
import { checkAuthorization } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { planDriveFolderUpdate } from "@repo/domain/utils/drive";
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
      .select(DRIVE_FOLDER_COLUMNS)
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

// PATCH - Rename a folder and/or retarget it (admins paste either an ID or a
// Drive URL). The slug follows the name; drive_index_nodes.root_slug follows
// the slug through ON UPDATE CASCADE.
export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, folder_id, label } = body ?? {};

    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "id est requis" }, { status: 400 });
    }
    if (label === undefined && folder_id === undefined) {
      return NextResponse.json(
        { error: "Rien à modifier : label ou folder_id est requis" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: rows, error: readError } = await supabase
      .from("drive_folders")
      .select("id, slug, label, folder_id");
    if (readError) {
      console.error("Error reading drive folders:", readError);
      return NextResponse.json(
        { error: "Failed to update drive folder" },
        { status: 500 },
      );
    }

    const current = rows.find((row) => row.id === id);
    if (!current) {
      return NextResponse.json(
        { error: "Dossier introuvable" },
        { status: 404 },
      );
    }

    const plan = planDriveFolderUpdate(
      current,
      rows.filter((row) => row.id !== id),
      { label, folder_id },
    );
    if (!plan.ok) {
      return NextResponse.json({ error: plan.error }, { status: 400 });
    }

    if (Object.keys(plan.patch).length === 0) {
      const { data, error } = await supabase
        .from("drive_folders")
        .select(DRIVE_FOLDER_COLUMNS)
        .eq("id", id)
        .single();
      if (error) throw error;
      return NextResponse.json({ folder: data, indexCleared: null });
    }

    const { data, error } = await supabase
      .from("drive_folders")
      .update(plan.patch)
      .eq("id", id)
      .select(DRIVE_FOLDER_COLUMNS)
      .single();

    if (error) {
      // Someone took the name or the Drive folder between the read and now.
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Un autre dossier porte déjà ce nom ou ce dossier Drive." },
          { status: 409 },
        );
      }
      console.error("Error updating drive folder:", error);
      return NextResponse.json(
        { error: "Failed to update drive folder" },
        { status: 500 },
      );
    }

    // A new Drive folder means the indexed files of the old one are gone from
    // this tab. Marking them removed now (the sync's own soft delete) keeps the
    // admin list true and spares the next sync a mass removal that it would
    // stop and hold for review. Members are unaffected: they browse Drive
    // live, through the folder ID. A failure here only brings back that
    // review step, so it does not fail the save.
    let indexCleared: number | null = null;
    if (plan.folderChanged) {
      try {
        const { data: cleared, error: clearError } = await createAdminClient()
          .from("drive_index_nodes")
          .update({ removed_at: new Date().toISOString() })
          .eq("root_slug", data.slug)
          .is("removed_at", null)
          .select("id");
        if (clearError) throw clearError;
        indexCleared = cleared.length;
      } catch (indexError) {
        console.error(
          "Error clearing the Drive index of a folder:",
          indexError,
        );
      }
    }

    return NextResponse.json({ folder: data, indexCleared });
  } catch (error) {
    console.error("Error in PATCH /api/drive-folders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

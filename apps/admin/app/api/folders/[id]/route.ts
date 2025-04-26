// app/api/folders/[id]/route.ts
import { UpdateFolderDTO } from "@/types/files";
import { checkAuthorization } from "@/utils/auth";
import { deleteStorageFolder } from "@/utils/storage";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const supabase = await createClient();
  const updates: UpdateFolderDTO = await request.json();

  const { data, error } = await supabase
    .from("folders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    // Start a transaction
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("*")
      .eq("id", id)
      .single();

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Check for subfolders
    const { data: subfolders, error: subfoldersError } = await supabase
      .from("folders")
      .select("id")
      .eq("parent_folder_id", id);

    if (subfoldersError) {
      throw subfoldersError;
    }

    if (subfolders && subfolders.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete folder containing subfolders" },
        { status: 400 },
      );
    }

    // Check for files in the folder
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("id, storage_path")
      .eq("folder_id", id);

    if (filesError) {
      throw filesError;
    }

    // Delete files from storage
    if (files && files.length > 0) {
      const storagePath = `${folder.program_id}/${folder.group_id}/${folder.id}`;
      await deleteStorageFolder(storagePath);

      // Delete file records from database
      const { error: deleteFilesError } = await supabase
        .from("files")
        .delete()
        .eq("folder_id", id);

      if (deleteFilesError) {
        throw deleteFilesError;
      }
    }

    // Finally, delete the folder record
    const { error: deleteFolderError } = await supabase
      .from("folders")
      .delete()
      .eq("id", id);

    if (deleteFolderError) {
      throw deleteFolderError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}

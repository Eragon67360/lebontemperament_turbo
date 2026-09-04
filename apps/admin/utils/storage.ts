import { createClient } from "./supabase/client";

export async function deleteStorageFolder(folderPath: string) {
  const supabase = createClient();

  // List all files in the folder
  const { data: files, error: listError } = await supabase.storage
    .from("programs")
    .list(folderPath);

  if (listError) {
    throw new Error(`Error listing files: ${listError.message}`);
  }

  // If there are files, delete them
  if (files && files.length > 0) {
    const filePaths = files.map(
      (file: { name: string }) => `${folderPath}/${file.name}`,
    );
    const { error: deleteError } = await supabase.storage
      .from("programs")
      .remove(filePaths);

    if (deleteError) {
      throw new Error(`Error deleting files: ${deleteError.message}`);
    }
  }
}

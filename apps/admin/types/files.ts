// types/files.ts
import type { Tables } from "@repo/domain/database.types";

/** A folder of the old Storage explorer (public.folders). */
export type Folder = Tables<"folders">;

/** A file of the old Storage explorer (public.files). */
export type FileRecord = Tables<"files">;

// types/files.ts
export interface CreateFolderDTO {
  name: string;
  program_id: string;
  group_id: string;
  parent_folder_id?: string;
}

export interface UpdateFolderDTO {
  name?: string;
  parent_folder_id?: string | null;
}

export interface CreateFileDTO {
  name: string;
  original_name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  program_id: string;
  group_id: string;
  folder_id?: string;
}

export interface UpdateFileDTO {
  name?: string;
  folder_id?: string | null;
}

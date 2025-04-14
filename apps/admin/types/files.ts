// types/files.ts
export interface Folder {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  program_id: string;
  group_id: string;
  parent_folder_id: string | null;
  path: string;
}

export interface FileRecord {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  original_name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  program_id: string;
  group_id: string;
  folder_id: string | null;
  uploaded_by: string;
}

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

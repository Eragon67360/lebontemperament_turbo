export interface CA {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  date_from: string;
  file_url: string | null;
  created_by: string;
}

export interface CreateCADTO {
  title: string;
  date_from: string;
  file_url?: string | null;
}

export interface UpdateCADTO extends Partial<CreateCADTO> {
  id: string;
}

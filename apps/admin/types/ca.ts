export interface CreateCADTO {
  title: string;
  date_from: string;
  file_url?: string | null;
}

export interface UpdateCADTO extends Partial<CreateCADTO> {
  id: string;
}

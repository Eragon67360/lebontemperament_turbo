export type Context = "orchestre" | "choeur" | "orchestre_et_choeur" | "autre";

export interface Concert {
  id: string;
  created_at: string;
  updated_at: string;
  place: string;
  date: string;
  time: string;
  context: Context;
  additional_informations?: string | null;
  name?: string | null;
  created_by: string;
  affiche: string | null;
}

export interface CreateConcertDTO {
  place: string;
  date: string;
  time: string;
  context: Context;
  additional_informations?: string;
  name?: string;
  affiche?: string | null;
}

export interface UpdateConcertDTO extends Partial<CreateConcertDTO> {
  id: string;
}

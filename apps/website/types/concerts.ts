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
  tour_id?: string | null;
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

export interface Tour {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  context: Context;
  start_date: string | null;
  end_date: string | null;
  tour_poster: string | null;
  is_active: boolean;
  created_by: string;
}

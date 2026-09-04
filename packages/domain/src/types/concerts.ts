import type { Tables } from "../database.types";

export type Concert = Tables<"concerts">;
export type Tour = Tables<"tours">;

export type Context = "orchestre" | "choeur" | "orchestre_et_choeur" | "autre";

export type CreateConcertDTO = {
  place: string;
  date: string;
  time: string;
  context: Context;
  additional_informations?: string;
  name?: string;
  affiche?: string | null;
  tour_id?: string | null;
  related_link?: string | null;
};

export type UpdateConcertDTO = Partial<CreateConcertDTO> & { id: string };

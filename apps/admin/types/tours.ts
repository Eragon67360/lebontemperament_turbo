import { Context } from "./concerts";

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
  concert_count?: number;
}

export interface CreateTourDTO {
  name: string;
  description?: string;
  context: Context;
  start_date?: string;
  end_date?: string;
  tour_poster?: string | null;
  is_active?: boolean;
}

export interface UpdateTourDTO extends Partial<CreateTourDTO> {
  id: string;
}

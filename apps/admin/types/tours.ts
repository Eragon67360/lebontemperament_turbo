import type { Context, Tour as DomainTour } from "@repo/domain/types/concerts";

export type Tour = DomainTour & { concert_count?: number };

export interface CreateTourDTO {
  name: string;
  description?: string;
  context: Context;
  start_date?: string | null;
  end_date?: string | null;
  tour_poster?: string | null;
  is_active?: boolean;
}

export interface UpdateTourDTO extends Partial<CreateTourDTO> {
  id: string;
}

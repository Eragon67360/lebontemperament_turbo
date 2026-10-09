import type { GroupType } from "@repo/domain/types/rehearsals";

export interface CreateRehearsalDTO {
  name: string;
  place: string;
  address?: string | null;
  room?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  group_type: GroupType;
}

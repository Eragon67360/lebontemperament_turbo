import type { GroupType } from "@repo/domain/types/rehearsals";

export interface CreateRehearsalDTO {
  name: string;
  place: string;
  date: string;
  start_time: string;
  end_time: string;
  group_type: GroupType;
}

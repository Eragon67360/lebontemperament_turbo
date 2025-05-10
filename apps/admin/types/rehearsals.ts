export type GroupType = "Orchestre" | "Choeur" | "Tous";

export interface Rehearsal {
  id: string;
  name: string;
  place: string;
  date: string;
  start_time: string;
  end_time: string;
  group_type: GroupType;
  created_at: string;
  updated_at: string;
}

export interface CreateRehearsalDTO {
  name: string;
  place: string;
  date: string;
  start_time: string;
  end_time: string;
  group_type: GroupType;
}

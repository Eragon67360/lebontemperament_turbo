export type GroupType =
  | "Orchestre"
  | "Hommes"
  | "Femmes"
  | "Jeunes/Enfants"
  | "Choeur complet"
  | "Tous";

export const GROUP_TYPES: GroupType[] = [
  "Orchestre",
  "Hommes",
  "Femmes",
  "Jeunes/Enfants",
  "Choeur complet",
  "Tous",
];

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

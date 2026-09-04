import type { Enums, Tables } from "../database.types";

export type Rehearsal = Tables<"rehearsals">;
export type GroupType = Enums<"group_type">;

// ponytail: kept in sync with the generated group_type enum values; order
// preserved for the existing UI.
export const GROUP_TYPES: GroupType[] = [
  "Orchestre",
  "Hommes",
  "Femmes",
  "Jeunes/Enfants",
  "Choeur complet",
  "Tous",
];

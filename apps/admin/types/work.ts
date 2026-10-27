// types/work.ts
import type { Tables } from "@repo/domain/database.types";

/** A tab of « Espace de travail » (public.groups). */
export type WorkGroup = Tables<"groups">;

/** A season's programme (public.programs). */
export type Program = Tables<"programs">;

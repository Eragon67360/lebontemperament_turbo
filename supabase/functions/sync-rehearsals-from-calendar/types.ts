import { z } from "npm:zod@3.25.76";

export const GROUP_TYPES = [
  "Orchestre",
  "Hommes",
  "Femmes",
  "Jeunes/Enfants",
  "Choeur complet",
  "Tous",
] as const;

export const LlmExtractionSchema = z.object({
  // true only for actual rehearsals ("Répétitions"). Concerts, auditions,
  // sorties, réunions, etc. must be classified as false so they are skipped.
  is_rehearsal: z.boolean(),
  name: z.string().trim().min(1),
  place: z.string().trim().min(1),
  group_type: z.enum(GROUP_TYPES),
});

export type GroupType = (typeof GROUP_TYPES)[number];
export type LlmExtraction = z.infer<typeof LlmExtractionSchema>;
export type SyncMode = "cron" | "test" | "dry-run";

export interface GoogleCalendarDate {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  updated: string;
  start?: GoogleCalendarDate;
  end?: GoogleCalendarDate;
}

export interface RehearsalRow {
  id: string;
  name: string;
  place: string;
  date: string;
  start_time: string;
  end_time: string;
  group_type: GroupType;
  event_id: string | null;
  google_updated_at: string | null;
}

export interface RehearsalUpsert {
  name: string;
  place: string;
  date: string;
  start_time: string;
  end_time: string;
  group_type: GroupType;
  event_id: string;
  google_updated_at: string;
}

export interface SyncError {
  event_id?: string;
  phase: "google" | "extract" | "write" | "log" | "auth";
  message: string;
}

export interface SyncStats {
  fetched: number;
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: SyncError[];
}

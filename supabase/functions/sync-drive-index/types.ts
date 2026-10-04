// The slice of the schema this function touches, typed for supabase-js
// (the full generated types live in packages/domain and aren't importable
// from Deno). Keep in step with 20261003120000_drive_index.sql.
import type { DiffCounts, IndexNode, RunDiff } from "./plan.ts";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type DriveSyncRunRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  mode: "dry_run" | "apply";
  trigger: "cron" | "admin";
  triggered_by: string | null;
  status: "running" | "success" | "error";
  counts: Json;
  diff: Json;
  error: string | null;
};

// Type aliases, not interfaces: supabase-js needs rows assignable to
// Record<string, unknown>, which interfaces are not.
export type DriveIndexNodeRow = IndexNode & {
  id: string;
  first_seen_at: string;
  synced_at: string;
  removed_at: string | null;
};

export type DriveFolderRow = {
  id: string;
  slug: string;
  label: string;
  folder_id: string;
  display_order: number;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      drive_folders: {
        Row: DriveFolderRow;
        Insert: Partial<DriveFolderRow>;
        Update: Partial<DriveFolderRow>;
        Relationships: [];
      };
      drive_index_nodes: {
        Row: DriveIndexNodeRow;
        Insert: Partial<DriveIndexNodeRow>;
        Update: Partial<DriveIndexNodeRow>;
        Relationships: [];
      };
      drive_sync_runs: {
        Row: DriveSyncRunRow;
        Insert: Partial<DriveSyncRunRow> & {
          mode: DriveSyncRunRow["mode"];
          trigger: DriveSyncRunRow["trigger"];
        };
        Update: Partial<DriveSyncRunRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      drive_index_apply: {
        Args: {
          p_run_id: string;
          p_nodes: IndexNode[];
          p_remove_ids: string[];
          p_counts: DiffCounts;
          p_diff: RunDiff;
          p_status?: "success" | "error";
          p_error?: string | null;
        };
        Returns: { upserted: number; removed: number };
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

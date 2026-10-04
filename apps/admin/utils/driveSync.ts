// Shapes and wording of the Drive index sync (edge function sync-drive-index).
// Pure: no React, no network, so utils/driveSync.test.ts can run under tsx.
import type { Database } from "@repo/domain/database.types";

export type DriveSyncMode = "dry_run" | "apply";
export type DriveSyncTrigger = "cron" | "admin";

export type DriveSyncRun =
  Database["public"]["Tables"]["drive_sync_runs"]["Row"];

export interface DriveSyncCounts {
  added: number;
  renamed: number;
  moved: number;
  removed: number;
  unchanged: number;
  unreadable_roots: number;
}

export interface DriveSyncDiffEntry {
  kind: "folder" | "file";
  name: string;
  path: string;
  previous_name?: string;
  previous_path?: string;
}

export interface DriveSyncUnreadableRoot {
  slug: string;
  reason: string;
}

export type DriveSyncDiffGroup = "added" | "renamed" | "moved" | "removed";

export interface DriveSyncDiff {
  added: DriveSyncDiffEntry[];
  renamed: DriveSyncDiffEntry[];
  moved: DriveSyncDiffEntry[];
  removed: DriveSyncDiffEntry[];
  unreadable_roots: DriveSyncUnreadableRoot[];
  truncated: Partial<Record<DriveSyncDiffGroup, number>>;
}

/** What POST /api/drive-sync answers on success. */
export interface DriveSyncResult {
  ok: true;
  run_id: string;
  mode: DriveSyncMode;
  trigger: DriveSyncTrigger;
  counts: DriveSyncCounts;
  diff: DriveSyncDiff;
  applied?: { upserted: number; removed: number };
  service_account: string;
}

export const DIFF_GROUPS: ReadonlyArray<{
  key: DriveSyncDiffGroup;
  label: string;
}> = [
  { key: "added", label: "Nouveaux" },
  { key: "renamed", label: "Renommés" },
  { key: "moved", label: "Déplacés" },
  { key: "removed", label: "Retirés" },
];

export function parseSyncMode(value: unknown): DriveSyncMode | null {
  return value === "dry_run" || value === "apply" ? value : null;
}

export function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n > 1 ? pluralForm : singular}`;
}

/** True when applying would change at least one row. */
export function hasChanges(counts: DriveSyncCounts): boolean {
  return counts.added + counts.renamed + counts.moved + counts.removed > 0;
}

/** "3 nouveaux, 1 renommé, 2 retirés" (zero groups left out; "aucun changement" when empty). */
export function describeCounts(counts: DriveSyncCounts): string {
  const parts = [
    counts.added > 0 ? plural(counts.added, "nouveau", "nouveaux") : null,
    counts.renamed > 0 ? plural(counts.renamed, "renommé", "renommés") : null,
    counts.moved > 0 ? plural(counts.moved, "déplacé", "déplacés") : null,
    counts.removed > 0 ? plural(counts.removed, "retiré", "retirés") : null,
  ].filter((part): part is string => part !== null);
  return parts.length ? parts.join(", ") : "aucun changement";
}

function isCounts(value: unknown): value is DriveSyncCounts {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return ["added", "renamed", "moved", "removed"].every(
    (key) => typeof v[key] === "number",
  );
}

/** A run still "running" after this long was cut short (function timeout, crash). */
export const STALE_RUN_MS = 10 * 60 * 1000;

/** The "Résultat" column of a past run. */
export function describeRun(
  run: {
    status: string;
    counts: unknown;
    error: string | null;
    started_at?: string;
  },
  now: number = Date.now(),
): string {
  if (run.status === "running") {
    const startedAt = run.started_at ? new Date(run.started_at).getTime() : now;
    return now - startedAt > STALE_RUN_MS ? "Interrompue" : "En cours…";
  }
  if (run.status === "error") {
    return run.error ? `Erreur : ${run.error}` : "Erreur";
  }
  const counts = isCounts(run.counts) ? run.counts : null;
  if (!counts) return "Terminé";
  const unreadable =
    typeof counts.unreadable_roots === "number" && counts.unreadable_roots > 0
      ? `, ${plural(counts.unreadable_roots, "dossier illisible", "dossiers illisibles")}`
      : "";
  return `${describeCounts(counts)}${unreadable}`;
}

export function triggerLabel(trigger: string): string {
  return trigger === "cron" ? "Automatique (nuit)" : "Manuel";
}

export function modeLabel(mode: string): string {
  return mode === "apply" ? "Application" : "Vérification";
}

const RUN_DATE = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export function formatRunDate(iso: string): string {
  return RUN_DATE.format(new Date(iso));
}

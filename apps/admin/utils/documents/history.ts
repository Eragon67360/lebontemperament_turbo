// « Historique » of a document: what a previous version (content_revisions
// .old_row, the whole row as JSON) puts back when restored. Only the content
// an admin edits; never ids, the collection, the address or timestamps.
import { documentDateLabel } from "@repo/domain/utils/documents";

export type RestorableFields = {
  title: string;
  document_date: string | null;
  date_precision: string | null;
  visibility: string;
  status: string;
  archived_at: string | null;
  storage_key: string;
  size_bytes: number | null;
};

const isString = (v: unknown): v is string => typeof v === "string";
const isNullableString = (v: unknown): v is string | null =>
  v === null || isString(v);

/** The fields to write back, or null when the stored row isn't usable. */
export function restorableFields(oldRow: unknown): RestorableFields | null {
  if (!oldRow || typeof oldRow !== "object") return null;
  const row = oldRow as Record<string, unknown>;
  if (
    !isString(row.title) ||
    !isNullableString(row.document_date) ||
    !isNullableString(row.date_precision) ||
    (row.visibility !== "public" && row.visibility !== "members") ||
    (row.status !== "published" && row.status !== "archived") ||
    !isNullableString(row.archived_at ?? null) ||
    !isString(row.storage_key) ||
    !(row.size_bytes === null || typeof row.size_bytes === "number")
  ) {
    return null;
  }
  return {
    title: row.title,
    document_date: row.document_date,
    date_precision: row.date_precision,
    visibility: row.visibility,
    status: row.status,
    archived_at: (row.archived_at as string | null | undefined) ?? null,
    storage_key: row.storage_key,
    size_bytes: row.size_bytes as number | null,
  };
}

/** One line for a version in the history: « Titre · 2024 · Membres · en ligne ». */
export function revisionSummary(oldRow: unknown): string {
  const fields = restorableFields(oldRow);
  if (!fields) return "Version illisible";
  return [
    `« ${fields.title} »`,
    documentDateLabel(fields.document_date, fields.date_precision),
    fields.visibility === "public" ? "Public" : "Membres",
    fields.status === "archived" ? "archivé" : "en ligne",
  ]
    .filter(Boolean)
    .join(" · ");
}

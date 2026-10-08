// What the « Documents de l'association » routes accept. Same limits as the
// table's CHECK constraints (supabase/migrations/20261008233000_site_documents.sql)
// and @repo/domain/utils/documents; unknown keys are refused.
import {
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_LABEL_MAX,
  COLLECTION_SLUG_PATTERN,
  DOCUMENT_FILE_NAME_PATTERN,
  DOCUMENT_TITLE_MAX,
} from "@repo/domain/utils/documents";
import { z } from "zod";

const title = z.string().trim().min(1).max(DOCUMENT_TITLE_MAX);
const isoDate = z.iso.date();
const precision = z.enum(["day", "month", "year"]);
const visibility = z.enum(["public", "members"]);
const sortOrder = z.number().int().min(-1000).max(1000);

/** documents/<collection>/<uuid>-<file name>.pdf, as the admin uploads them. */
export const UPLOAD_KEY_PATTERN =
  /^documents\/[a-z0-9]+(?:-[a-z0-9]+)*\/[0-9a-f-]{36}-[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/;

const storageKey = z.string().max(400).regex(UPLOAD_KEY_PATTERN);

/** A date and how to show it come together, or not at all. */
const dated = <
  T extends { document_date?: string | null; date_precision?: string | null },
>(
  body: T,
) =>
  (body.document_date === undefined) === (body.date_precision === undefined) &&
  (body.document_date === null) === (body.date_precision === null);

export const documentCreateSchema = z
  .object({
    collection_id: z.guid(),
    title,
    file_name: z.string().max(150).regex(DOCUMENT_FILE_NAME_PATTERN),
    storage_key: storageKey,
    document_date: isoDate.nullable(),
    date_precision: precision.nullable(),
    visibility,
    sort_order: sortOrder.optional(),
  })
  .strict()
  .refine(dated, { message: "La date et sa précision vont ensemble" });

export const documentPatchSchema = z
  .object({
    title: title.optional(),
    document_date: isoDate.nullable().optional(),
    date_precision: precision.nullable().optional(),
    visibility: visibility.optional(),
    sort_order: sortOrder.optional(),
    status: z.enum(["published", "archived"]).optional(),
    /** « Remplacer le fichier »: a new upload under documents/. */
    storage_key: storageKey.optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "Aucun champ à modifier",
  })
  .refine(dated, { message: "La date et sa précision vont ensemble" });

export const collectionCreateSchema = z
  .object({
    label: z.string().trim().min(1).max(COLLECTION_LABEL_MAX),
    description: z.string().trim().max(COLLECTION_DESCRIPTION_MAX).nullable(),
    slug: z.string().max(40).regex(COLLECTION_SLUG_PATTERN),
  })
  .strict();

export const collectionPatchSchema = z
  .object({
    id: z.guid(),
    label: z.string().trim().min(1).max(COLLECTION_LABEL_MAX).optional(),
    description: z
      .string()
      .trim()
      .max(COLLECTION_DESCRIPTION_MAX)
      .nullable()
      .optional(),
    sort_order: sortOrder.optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 1, {
    message: "Aucun champ à modifier",
  });

export const restoreSchema = z
  .object({ revision_id: z.number().int().positive() })
  .strict();

/** Columns the admin reads (explicit, never `*`). */
export const DOCUMENT_COLUMNS =
  "id, collection_id, title, file_name, storage_key, document_date, date_precision, size_bytes, mime_type, visibility, status, sort_order, created_by, updated_by, created_at, updated_at, archived_at";
export const COLLECTION_COLUMNS =
  "id, slug, label, description, sort_order, created_at, updated_at";

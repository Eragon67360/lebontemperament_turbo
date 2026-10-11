// Files attached to events (public.event_documents, bucket site-media under
// events/<event id>/): what the admin's routes accept, and the check of a
// file the browser has just uploaded before a row points at it.
import type { Database } from "@repo/domain/database.types";
import {
  EVENT_DOCUMENT_FILE_NAME_PATTERN,
  EVENT_DOCUMENT_LABEL_MAX,
  EVENT_DOCUMENT_TYPES,
  eventDocumentContentMatches,
  eventDocumentMimeType,
  isEventDocumentKey,
} from "@repo/domain/utils/eventDocuments";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sizeFromContentRange } from "../documents/storage";
import { EVENT_DOCUMENTS_BUCKET } from "./bucket";

export const EVENT_DOCUMENT_ADMIN_COLUMNS =
  "id, event_id, label, file_name, storage_key, mime_type, size_bytes, sort_order, created_at";

const label = z.string().trim().min(1).max(EVENT_DOCUMENT_LABEL_MAX);

export const eventDocumentCreateSchema = z
  .object({
    event_id: z.guid(),
    label,
    file_name: z.string().max(150).regex(EVENT_DOCUMENT_FILE_NAME_PATTERN),
    storage_key: z.string().max(400),
    mime_type: z
      .string()
      .refine((type) => Object.hasOwn(EVENT_DOCUMENT_TYPES, type)),
  })
  .strict()
  .refine((body) => isEventDocumentKey(body.storage_key, body.event_id), {
    message: "Fichier introuvable",
    path: ["storage_key"],
  })
  .refine((body) => eventDocumentMimeType(body.file_name) === body.mime_type, {
    message: "Le type du fichier ne correspond pas à son nom",
    path: ["mime_type"],
  });

export const eventDocumentPatchSchema = z
  .object({ id: z.guid(), label })
  .strict();

export const eventDocumentDeleteSchema = z.object({ id: z.guid() }).strict();

export type UploadedFileCheck =
  { ok: true; sizeBytes: number | null } | { ok: false; error: string };

/**
 * The uploaded object exists and starts like its type (a PDF with %PDF-, a
 * .docx or .xlsx like a zip, a .doc or .xls like an Office 97 file). The
 * bucket is public, so the first bytes are read from the public URL.
 */
export async function checkUploadedEventFile(
  supabase: SupabaseClient<Database>,
  storageKey: string,
  mimeType: string,
): Promise<UploadedFileCheck> {
  const { data } = supabase.storage
    .from(EVENT_DOCUMENTS_BUCKET)
    .getPublicUrl(storageKey);
  let response: Response;
  try {
    response = await fetch(data.publicUrl, {
      headers: { Range: "bytes=0-1099" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { ok: false, error: "Le fichier envoyé n'a pas pu être vérifié" };
  }
  if (!response.ok) {
    return { ok: false, error: "Le fichier envoyé est introuvable" };
  }
  const bytes = new Uint8Array(await response.arrayBuffer()).slice(0, 1100);
  if (!eventDocumentContentMatches(mimeType, bytes)) {
    return {
      ok: false,
      error: "Le contenu du fichier ne correspond pas à son type",
    };
  }
  const sizeBytes =
    response.status === 206
      ? sizeFromContentRange(response.headers.get("content-range"))
      : Number(response.headers.get("content-length")) || null;
  return { ok: true, sizeBytes };
}

/** Removes objects from site-media; failures are logged, never thrown. */
export async function removeEventFiles(
  supabase: SupabaseClient<Database>,
  storageKeys: string[],
): Promise<void> {
  if (storageKeys.length === 0) return;
  const { error } = await supabase.storage
    .from(EVENT_DOCUMENTS_BUCKET)
    .remove(storageKeys);
  if (error) console.error("Event files left in site-media:", error.message);
}

// The order form attached to an order (« bon de commande », orders.document_*,
// private bucket order-documents under <order id>/): what the admin's route
// accepts, the check of a file the browser has just uploaded before the order
// points at it, and the removal of files. Rules in
// @repo/domain/utils/orderDocuments.
import type { Database } from "@repo/domain/database.types";
import {
  isOrderDocumentKey,
  ORDER_DOCUMENT_FILE_NAME_PATTERN,
  ORDER_DOCUMENT_TYPES,
  ORDER_DOCUMENTS_BUCKET,
  orderDocumentContentMatches,
  orderDocumentMimeType,
} from "@repo/domain/utils/orderDocuments";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sizeFromContentRange } from "../documents/storage";

/** PUT body: a file the browser has just uploaded for `orderId`. */
export function orderDocumentSchema(orderId: string) {
  return z
    .object({
      storage_key: z.string().max(400),
      file_name: z.string().max(150).regex(ORDER_DOCUMENT_FILE_NAME_PATTERN),
      mime_type: z
        .string()
        .refine((type) => Object.hasOwn(ORDER_DOCUMENT_TYPES, type)),
    })
    .strict()
    .refine((body) => isOrderDocumentKey(body.storage_key, orderId), {
      message: "Fichier introuvable",
      path: ["storage_key"],
    })
    .refine(
      (body) => orderDocumentMimeType(body.file_name) === body.mime_type,
      {
        message: "Le type du fichier ne correspond pas à son nom",
        path: ["mime_type"],
      },
    );
}

export type UploadedFileCheck =
  { ok: true; sizeBytes: number | null } | { ok: false; error: string };

/**
 * The uploaded object exists and starts like its type (a PDF with %PDF-, a
 * photo with its magic number, Office files like a zip or an Office 97
 * file). The bucket is private: the first bytes are read through a signed
 * link valid one minute, with the superadmin's own session.
 */
export async function checkUploadedOrderDocument(
  supabase: SupabaseClient<Database>,
  storageKey: string,
  mimeType: string,
): Promise<UploadedFileCheck> {
  const { data, error } = await supabase.storage
    .from(ORDER_DOCUMENTS_BUCKET)
    .createSignedUrl(storageKey, 60);
  if (error || !data?.signedUrl) {
    return { ok: false, error: "Le fichier envoyé est introuvable" };
  }
  let response: Response;
  try {
    response = await fetch(data.signedUrl, {
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
  if (!orderDocumentContentMatches(mimeType, bytes)) {
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

/**
 * Removes order files; failures are logged, never thrown (the nightly
 * purge-order-documents removes what is left).
 */
export async function removeOrderDocuments(
  supabase: SupabaseClient<Database>,
  storageKeys: readonly (string | null | undefined)[],
): Promise<void> {
  const keys = storageKeys.filter((key): key is string => !!key);
  if (keys.length === 0) return;
  const { error } = await supabase.storage
    .from(ORDER_DOCUMENTS_BUCKET)
    .remove(keys);
  if (error) console.error("Order files left in storage:", error.message);
}

/** The columns the order gets for an attached file, or all null to detach. */
export function documentColumns(
  file: {
    storage_key: string;
    file_name: string;
    mime_type: string;
    size_bytes: number | null;
  } | null,
  now = new Date(),
) {
  return {
    document_key: file?.storage_key ?? null,
    document_name: file?.file_name ?? null,
    document_mime_type: file?.mime_type ?? null,
    document_size_bytes: file?.size_bytes ?? null,
    document_added_at: file ? now.toISOString() : null,
  };
}

// Checks an object an admin just uploaded to site-media before a row points
// at it: it exists, it starts like a PDF, and its size. The bucket is public,
// so its first bytes are read from the public URL with a Range request.
import type { Database } from "@repo/domain/database.types";
import { looksLikePdf } from "@repo/domain/utils/documents";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DOCUMENTS_BUCKET = "site-media";

export type UploadCheck =
  { ok: true; sizeBytes: number | null } | { ok: false; error: string };

/** Total size from `Content-Range: bytes 0-7/123456`. */
export function sizeFromContentRange(header: string | null): number | null {
  const total = header?.split("/")[1];
  const size = total ? Number(total) : NaN;
  return Number.isSafeInteger(size) && size >= 0 ? size : null;
}

export async function checkUploadedPdf(
  supabase: SupabaseClient<Database>,
  storageKey: string,
): Promise<UploadCheck> {
  const { data } = supabase.storage
    .from(DOCUMENTS_BUCKET)
    .getPublicUrl(storageKey);
  let response: Response;
  try {
    response = await fetch(data.publicUrl, {
      headers: { Range: "bytes=0-7" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { ok: false, error: "Le fichier envoyé n'a pas pu être vérifié" };
  }
  if (!response.ok) {
    return { ok: false, error: "Le fichier envoyé est introuvable" };
  }
  const bytes = new Uint8Array(await response.arrayBuffer()).slice(0, 8);
  if (!looksLikePdf(bytes)) {
    return { ok: false, error: "Le fichier envoyé n'est pas un PDF" };
  }
  const sizeBytes =
    response.status === 206
      ? sizeFromContentRange(response.headers.get("content-range"))
      : Number(response.headers.get("content-length")) || null;
  return { ok: true, sizeBytes };
}

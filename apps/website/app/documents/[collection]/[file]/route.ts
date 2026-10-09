import { documentObjectUrl } from "@/lib/siteDocuments";
import { createPublicClient } from "@/utils/supabase/public";

/**
 * GET /documents/<collection>/<file> — the stable address of a document of
 * « Documents de l'association »: a redirect to its file in Storage. Every
 * published document opens by link, whatever its visibility (decision of
 * 2026-10-08); archived and unknown ones are 404.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ collection: string; file: string }> },
) {
  const { collection, file } = await params;
  if (collection.length > 40 || file.length > 150) {
    return new Response("Not found", { status: 404 });
  }

  const { data: storageKey, error } = await createPublicClient().rpc(
    "site_document_object",
    { p_collection: collection, p_file_name: file },
  );

  if (error) {
    console.error("[documents] lookup failed:", error.message);
    return new Response("Service unavailable", { status: 503 });
  }
  if (!storageKey) return new Response("Not found", { status: 404 });

  return new Response(null, {
    status: 307,
    headers: {
      Location: documentObjectUrl(storageKey),
      // Short: an archived or replaced document must stop resolving soon.
      "Cache-Control": "public, max-age=60, s-maxage=300",
    },
  });
}

export const HEAD = GET;

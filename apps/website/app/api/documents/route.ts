import { listDocumentCollections } from "@/lib/siteDocuments";
import { checkAuthorization } from "@/utils/auth";
import { createPublicClient } from "@/utils/supabase/public";
import { NextResponse } from "next/server";

/**
 * GET /api/documents — « Documents de l'association » the caller may read,
 * by collection: visitors get the public ones, signed-in members (session
 * cookie, or `Authorization: Bearer` from the app) every published one.
 *
 * Response: `{ collections: [{ slug, label, description,
 *   documents: [{ id, title, dateLabel, visibility, href }] }] }`, newest
 * first; `href` is a path on this site.
 */
export async function GET() {
  const auth = await checkAuthorization();
  const supabase = auth.authorized ? auth.supabase : createPublicClient();
  const { collections } = await listDocumentCollections(supabase);

  return NextResponse.json(
    { collections },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

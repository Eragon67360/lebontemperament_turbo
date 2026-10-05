import { getFeaturedMemories } from "@/lib/anniversary";
import { getPublicFeatureFlags } from "@/lib/featureFlags";
import { checkAdminAuth } from "@/utils/auth";
import { NextResponse } from "next/server";

/**
 * GET /api/anniversary/featured-memories — the featured memories shown on
 * `/40-ans`, public columns only (never the author's email). The page's
 * client refetches here after a realtime change instead of querying the
 * table itself, which row-level security refuses to visitors. Same gate as
 * the page: public while the anniversary flag is on, admins may preview.
 */
export async function GET() {
  const { anniversary: isEnabled } = await getPublicFeatureFlags();

  if (!isEnabled) {
    const { isAdmin } = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const memories = await getFeaturedMemories();

  return NextResponse.json(
    { memories },
    { headers: { "Cache-Control": "no-store" } },
  );
}

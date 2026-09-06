import { createClient } from "@supabase/supabase-js";

// Safety net for the safe-write tests: deletes E2E_-namespaced rows older
// than 24h, catching orphans from killed/crashed runs. The 24h window avoids
// touching rows a concurrent run might still be using.
// Runs server-side only — the service-role key never enters a browser context.
export default async function globalTeardown() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("[e2e] No Supabase service key — skipping orphan sweep.");
    return;
  }

  const supabase = createClient(url, key);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { error, count } = await supabase
    .from("concerts")
    .delete({ count: "exact" })
    .like("name", "E2E\\_%")
    .lt("created_at", cutoff);

  if (error) {
    console.warn(`[e2e] Orphan sweep failed: ${error.message}`);
  } else if (count) {
    console.log(`[e2e] Swept ${count} orphaned E2E_ row(s).`);
  }
}

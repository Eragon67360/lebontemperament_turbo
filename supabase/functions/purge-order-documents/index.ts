// Removes the order forms (« bons de commande ») that no live order points
// at any more, as the privacy policy promises: the nightly purge
// (purge_expired_order_personal_data, 03:35 UTC) erases a buyer's data 30
// days after the delivery day, document reference included, but Storage
// objects can't be deleted from SQL. Also catches the files of deleted
// orders and sales (the app deletes orders directly), replaced documents
// and uploads never attached.
//
// order_documents_to_purge() (migration 20261022142528) lists the files of
// the private bucket order-documents older than a day that no live order
// names; this function removes them through the Storage API.
//
// Body (optional): `{ "dry_run": true }` counts what it would remove and
// changes nothing. Caller: the pg_cron job `purge-order-documents` (03:50
// UTC, internal secret) or anyone holding that secret; nothing else.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { requireInternalSecret } from "../_shared/caller-auth.ts";
import { requireServiceKey } from "../_shared/supabase-keys.ts";
import { batches, orderFilePaths } from "./plan.ts";

const BUCKET = "order-documents";
const LIMIT = 1000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function log(event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ fn: "purge-order-documents", event, ...data }));
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

Deno.serve(async (req) => {
  const refused = requireInternalSecret(req);
  if (refused) return refused;

  let dryRun = false;
  try {
    const body = await req.json();
    dryRun = body?.dry_run === true;
  } catch {
    // No body: a normal run.
  }

  try {
    const supabase = createClient(
      requireEnv("SUPABASE_URL"),
      requireServiceKey(),
      { auth: { persistSession: false } },
    );

    const { data, error } = await supabase.rpc("order_documents_to_purge", {
      p_limit: LIMIT,
    });
    if (error) throw new Error(`order_documents_to_purge: ${error.message}`);
    const paths = orderFilePaths((data ?? []) as unknown[]);

    if (dryRun || paths.length === 0) {
      log("planned", { dry_run: dryRun, files: paths.length });
      return jsonResponse({ dry_run: dryRun, files: paths.length });
    }

    for (const batch of batches(paths)) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove(batch);
      if (removeError) throw new Error(`storage: ${removeError.message}`);
    }

    log("removed", { files: paths.length });
    return jsonResponse({ files: paths.length });
  } catch (err) {
    log("error", { message: err instanceof Error ? err.message : String(err) });
    return jsonResponse({ error: "Purge failed" }, 500);
  }
});

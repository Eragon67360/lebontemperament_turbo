// Removes the screenshots of signalements resolved more than a year ago, as
// the privacy policy promises (« 1 an au plus après leur résolution »). Refs
// #355.
//
// Storage objects can't be deleted from SQL, so the daily purge
// (purge_expired_records(), migration 20261008110000) keeps a report while
// it still lists screenshots. This function removes the files through the
// Storage API, then empties the report's screenshot_paths; the purge deletes
// the report at its next run (03:45 UTC, five minutes after this one).
//
// Body (optional): `{ "dry_run": true }` lists what it would remove and
// changes nothing. Caller: the pg_cron job `purge-bug-screenshots` (internal
// secret) or anyone holding that secret; nothing else.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { requireInternalSecret } from "../_shared/caller-auth.ts";

const BUCKET = "bug-screenshots";
const RETENTION_DAYS = 365;

type ExpiredReport = {
  id: string;
  reported_by: string;
  screenshot_paths: string[];
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function log(event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ fn: "purge-bug-screenshots", event, ...data }));
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

/** A report may only point at its author's folder (the INSERT policy's
 * rule); anything else is left alone rather than removed. */
function ownPaths(report: ExpiredReport): string[] {
  const folder = `${report.reported_by}/`;
  return report.screenshot_paths.filter(
    (path) => path.startsWith(folder) && !path.includes(".."),
  );
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
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } },
    );

    const cutoff = new Date(
      Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data, error } = await supabase
      .from("bug_reports")
      .select("id, reported_by, screenshot_paths")
      .eq("status", "resolved")
      .lt("resolved_at", cutoff)
      .neq("screenshot_paths", "{}")
      .limit(200);
    if (error) throw new Error(`bug_reports: ${error.message}`);
    const reports = (data ?? []) as ExpiredReport[];

    const paths = reports.flatMap(ownPaths);
    if (dryRun || reports.length === 0) {
      log("planned", {
        dry_run: dryRun,
        reports: reports.length,
        files: paths.length,
      });
      return jsonResponse({
        dry_run: dryRun,
        reports: reports.length,
        files: paths.length,
      });
    }

    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove(paths);
      if (removeError) throw new Error(`storage: ${removeError.message}`);
    }

    const { error: updateError } = await supabase
      .from("bug_reports")
      .update({ screenshot_paths: [] })
      .in(
        "id",
        reports.map((r) => r.id),
      );
    if (updateError)
      throw new Error(`bug_reports update: ${updateError.message}`);

    log("removed", { reports: reports.length, files: paths.length });
    return jsonResponse({ reports: reports.length, files: paths.length });
  } catch (err) {
    log("error", { message: err instanceof Error ? err.message : String(err) });
    return jsonResponse({ error: "Purge failed" }, 500);
  }
});

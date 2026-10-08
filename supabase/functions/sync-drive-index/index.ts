// Walks the Drive roots of `drive_folders` with the service account and
// compares them with `drive_index_nodes`.
//
// - `{ "mode": "dry_run" }` records the diff in a `drive_sync_runs` row and
//   returns it; nothing else is written.
// - `{ "mode": "apply" }` upserts the walk and soft-deletes what disappeared,
//   in one transaction (`drive_index_apply`), then returns the same payload.
//
// Callers: the nightly pg_cron job (internal secret) and the admin's
// POST /api/drive-sync, which forwards the signed-in admin's session; the
// function verifies it through Supabase Auth and logs the run as that
// admin's. The admin app never holds the internal secret.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { requireInternalSecretOrAdmin } from "../_shared/caller-auth.ts";
import {
  createDriveReader,
  getDriveAccessToken,
  serviceAccountEmail,
} from "./google-drive.ts";
import {
  DEFAULT_CAPS,
  describeFailure,
  diffIndex,
  planApply,
  toRunDiff,
  walkRoots,
  type ExistingNode,
  type RootFolder,
  type RunDiff,
} from "./plan.ts";
import type { Database } from "./types.ts";
import { requireServiceKey } from "../_shared/supabase-keys.ts";

type SyncMode = "dry_run" | "apply";
type Trigger = "cron" | "admin";
type Supabase = ReturnType<typeof createClient<Database>>;

const EXISTING_PAGE = 1000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function log(event: string, data: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      source: "sync-drive-index",
      event,
      ...data,
    }),
  );
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Body: `{ mode }`. Who triggered the run comes from the caller check, never from the body. */
async function parseMode(req: Request): Promise<SyncMode> {
  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const mode = raw.mode;
  if (mode !== "dry_run" && mode !== "apply") {
    throw new Error('mode must be "dry_run" or "apply".');
  }
  return mode;
}

async function loadRoots(supabase: Supabase): Promise<RootFolder[]> {
  const { data, error } = await supabase
    .from("drive_folders")
    .select("slug, folder_id, display_order")
    .order("display_order");
  if (error) throw new Error(`drive_folders: ${error.message}`);
  return data ?? [];
}

async function loadExisting(supabase: Supabase): Promise<ExistingNode[]> {
  const rows: ExistingNode[] = [];
  for (let from = 0; ; from += EXISTING_PAGE) {
    const { data, error } = await supabase
      .from("drive_index_nodes")
      .select(
        "drive_id, parent_drive_id, root_slug, kind, name, path, removed_at",
      )
      .order("drive_id")
      .range(from, from + EXISTING_PAGE - 1);
    if (error) throw new Error(`drive_index_nodes: ${error.message}`);
    const page: ExistingNode[] = data ?? [];
    rows.push(...page);
    if (page.length < EXISTING_PAGE) break;
  }
  return rows;
}

async function openRun(
  supabase: Supabase,
  mode: SyncMode,
  trigger: Trigger,
  triggeredBy: string | null,
): Promise<string> {
  const { data, error } = await supabase
    .from("drive_sync_runs")
    .insert({ mode, trigger, triggered_by: triggeredBy, status: "running" })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(`drive_sync_runs: ${error?.message ?? "no id returned"}`);
  }
  return data.id;
}

async function closeRun(
  supabase: Supabase,
  runId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from("drive_sync_runs")
    .update({ finished_at: new Date().toISOString(), ...patch })
    .eq("id", runId);
  if (error)
    log("run_update_failed", { run_id: runId, message: error.message });
}

serve(async (req) => {
  let supabase: Supabase;
  try {
    supabase = createClient<Database>(
      requireEnv("SUPABASE_URL"),
      requireServiceKey(),
    );
  } catch (error) {
    log("fatal", {
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ ok: false, error: "Server misconfigured" }, 500);
  }

  // The cron job (internal secret) or a signed-in admin (session verified
  // through Supabase Auth); anyone else is refused before anything runs.
  const caller = await requireInternalSecretOrAdmin(req, supabase);
  if (caller instanceof Response) return caller;

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
  }

  let mode: SyncMode;
  try {
    mode = await parseMode(req);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      400,
    );
  }

  const trigger: Trigger = caller.kind === "admin" ? "admin" : "cron";
  const triggeredBy = caller.kind === "admin" ? caller.userId : null;
  log("request_received", { mode, trigger });

  let runId: string | null = null;

  try {
    const serviceAccountJson = requireEnv("GOOGLE_SERVICE_ACCOUNT_JSON");

    runId = await openRun(supabase, mode, trigger, triggeredBy);
    log("run_opened", { run_id: runId });

    const roots = await loadRoots(supabase);
    if (roots.length === 0) throw new Error("drive_folders is empty.");

    const accessToken = await getDriveAccessToken(serviceAccountJson);
    const reader = createDriveReader(accessToken);
    const walk = await walkRoots(roots, reader, { caps: DEFAULT_CAPS, log });
    log("walk_complete", {
      nodes: walk.nodes.length,
      readable_roots: walk.readableRootSlugs,
      unreadable_roots: walk.unreadableRoots,
    });

    const existing = await loadExisting(supabase);
    const diff = diffIndex(walk, existing);
    const runDiff: RunDiff = toRunDiff(diff);
    log("diff_complete", { ...diff.counts });

    let applied: { upserted: number; removed: number } | undefined;
    let blockedRoots: string[] = [];
    let error: string | null = null;
    if (mode === "dry_run") {
      await closeRun(supabase, runId, {
        status: "success",
        counts: diff.counts,
        diff: runDiff,
      });
    } else {
      // A cron apply never mass-removes: see planApply.
      const plan = planApply(walk, diff, existing, trigger);
      blockedRoots = plan.blockedRoots;
      error = plan.error;
      const { data, error: rpcError } = await supabase.rpc(
        "drive_index_apply",
        {
          p_run_id: runId,
          p_nodes: plan.nodes,
          p_remove_ids: plan.removeIds,
          p_counts: diff.counts,
          p_diff: runDiff,
          p_status: plan.status,
          p_error: plan.error,
        },
      );
      if (rpcError) throw new Error(`drive_index_apply: ${rpcError.message}`);
      applied = data;
      log("apply_complete", { ...applied, blocked_roots: blockedRoots });
    }

    return jsonResponse(
      {
        ok: error === null,
        run_id: runId,
        mode,
        trigger,
        counts: diff.counts,
        diff: runDiff,
        applied,
        blocked_roots: blockedRoots,
        error: error ?? undefined,
        error_code: error ? "cron_removals" : undefined,
        service_account: serviceAccountEmail(serviceAccountJson),
      },
      error === null ? 200 : 409,
    );
  } catch (error) {
    const failure = describeFailure(error);
    log("fatal", {
      mode,
      run_id: runId,
      code: failure.code,
      detail: failure.detail,
    });
    if (runId) {
      await closeRun(supabase, runId, {
        status: "error",
        error: failure.message,
      });
    }
    return jsonResponse(
      {
        ok: false,
        run_id: runId,
        mode,
        error: failure.message,
        error_code: failure.code,
      },
      500,
    );
  }
});

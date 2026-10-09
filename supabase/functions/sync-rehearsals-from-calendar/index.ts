import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { chunk, mapSettledWithConcurrency } from "./concurrency.ts";
import { addDays, getParisToday, isAllDayEvent } from "./datetime.ts";
import { fetchCalendarEvents } from "./google-calendar.ts";
import { extractRehearsalFields } from "./llm-extract.ts";
import {
  resolveRehearsalTimes,
  type ResolvedRehearsalTimes,
} from "./rehearsal-times.ts";
import type {
  GoogleCalendarEvent,
  RehearsalRow,
  RehearsalUpsert,
  SyncMode,
  SyncStats,
} from "./types.ts";
import { requireServiceKey } from "../_shared/supabase-keys.ts";

const EXTRACT_CONCURRENCY = 4;
const WRITE_BATCH_SIZE = 20;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function log(event: string, data: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      source: "sync",
      event,
      ...data,
    }),
  );
}

function startISO(event: GoogleCalendarEvent): string {
  return event.start?.dateTime ?? event.start?.date ?? "";
}

function getMode(req: Request): SyncMode {
  const raw = new URL(req.url).searchParams.get("mode") ?? "cron";
  if (raw === "cron" || raw === "test" || raw === "dry-run") return raw;
  throw new Error(`Unsupported mode: ${raw}`);
}

/** `?silence=1`: no push at all, for a one-off backfill (needs the secret). */
function wantsSilence(req: Request): boolean {
  return new URL(req.url).searchParams.get("silence") === "1";
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function hasGoogleUpdate(
  existing: RehearsalRow | undefined,
  event: GoogleCalendarEvent,
): boolean {
  if (!existing?.google_updated_at) return true;
  return (
    new Date(event.updated).getTime() >
    new Date(existing.google_updated_at).getTime()
  );
}

async function insertSyncLog(
  supabase: ReturnType<typeof createClient>,
  mode: SyncMode,
): Promise<string | null> {
  if (mode === "dry-run") return null;

  const { data, error } = await supabase
    .from("rehearsal_sync_logs")
    .insert({ mode, status: "running" })
    .select("id")
    .single();

  if (error) {
    console.error(JSON.stringify({ phase: "log", message: error.message }));
    return null;
  }

  return data?.id ?? null;
}

async function finalizeSyncLog(
  supabase: ReturnType<typeof createClient>,
  logId: string | null,
  stats: SyncStats,
  status: "success" | "partial" | "failed",
): Promise<void> {
  if (!logId) return;

  const { error } = await supabase
    .from("rehearsal_sync_logs")
    .update({
      finished_at: new Date().toISOString(),
      status,
      events_fetched: stats.fetched,
      created: stats.created,
      updated: stats.updated,
      deleted: stats.deleted,
      skipped: stats.skipped,
      errors: stats.errors,
    })
    .eq("id", logId);

  if (error) {
    console.error(JSON.stringify({ phase: "log", message: error.message }));
  }
}

async function hasSuccessfulRealRun(
  supabase: ReturnType<typeof createClient>,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("rehearsal_sync_logs")
    .select("id")
    .eq("status", "success")
    .neq("mode", "dry-run")
    .limit(1);

  if (error) {
    console.error(JSON.stringify({ phase: "log", message: error.message }));
    return true;
  }

  return Boolean(data?.length);
}

function responsePayload(
  mode: SyncMode,
  executed: boolean,
  stats: SyncStats,
  syncLogId: string | null,
  sample: RehearsalUpsert[],
  plan?: { upserts: number; deletes: number },
) {
  return {
    mode,
    executed,
    counts: {
      fetched: stats.fetched,
      created: stats.created,
      updated: stats.updated,
      deleted: stats.deleted,
      skipped: stats.skipped,
      errors_count: stats.errors.length,
    },
    errors: stats.errors,
    sample: mode === "cron" ? undefined : sample.slice(0, 3),
    plan,
    sync_log_id: syncLogId,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
  }

  let mode: SyncMode = "cron";
  let logId: string | null = null;
  let supabase: ReturnType<typeof createClient> | null = null;
  const stats: SyncStats = {
    fetched: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    skipped: 0,
    errors: [],
  };

  try {
    mode = getMode(req);
    log("request_received", { mode, method: req.method });

    const syncSecret = requireEnv("SYNC_CRON_SECRET");
    if (req.headers.get("x-sync-secret") !== syncSecret) {
      log("unauthorized", { mode });
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    supabase = createClient(requireEnv("SUPABASE_URL"), requireServiceKey());

    const serviceAccountJson = requireEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
    const calendarId = requireEnv("GOOGLE_CALENDAR_ID");
    const openAiKey = requireEnv("OPENAI_API_KEY");
    log("env_loaded", { mode });

    logId = await insertSyncLog(supabase, mode);
    log("sync_log_created", { mode, sync_log_id: logId });

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMaxDate =
      mode === "test" || mode === "dry-run" ? addDays(now, 60) : undefined;
    const timeMax = timeMaxDate?.toISOString();
    const parisToday = getParisToday(now);
    const parisTimeMax = timeMaxDate ? getParisToday(timeMaxDate) : undefined;
    log("window", { timeMin, timeMax, parisToday, parisTimeMax });

    const googleEvents = await fetchCalendarEvents({
      calendarId,
      serviceAccountJson,
      timeMin,
      timeMax,
    });
    stats.fetched = googleEvents.length;
    log("events_fetched", {
      count: googleEvents.length,
      events: googleEvents.map((event) => ({
        id: event.id,
        summary: event.summary ?? "",
        start: startISO(event),
        all_day: isAllDayEvent(event.start),
        status: event.status ?? "confirmed",
      })),
    });

    const googleEventIds = new Set(googleEvents.map((event) => event.id));

    let syncedQuery = supabase
      .from("rehearsals")
      .select(
        "id, name, place, date, start_time, end_time, group_type, event_id, google_updated_at",
      )
      .not("event_id", "is", null)
      .gte("date", parisToday);

    if (parisTimeMax) {
      syncedQuery = syncedQuery.lte("date", parisTimeMax);
    }

    const { data: syncedRows, error: syncedRowsError } = await syncedQuery;
    if (syncedRowsError) throw syncedRowsError;

    const dbSynced = (syncedRows ?? []) as RehearsalRow[];
    const dbByEventId = new Map(
      dbSynced
        .filter((row) => row.event_id)
        .map((row) => [row.event_id as string, row]),
    );
    log("db_synced_loaded", { count: dbSynced.length });

    const upserts: RehearsalUpsert[] = [];
    const reclassifiedDeleteIds: string[] = [];
    let skippedCancelled = 0;
    let skippedUnchanged = 0;
    let skippedNonRehearsal = 0;
    let skippedAllDayNoRule = 0;

    type EventOutcome =
      | { kind: "cancelled" }
      | { kind: "unchanged" }
      | { kind: "non_rehearsal"; classifiedName: string; existingId?: string }
      | { kind: "all_day_no_rule" }
      | {
          kind: "upsert";
          upsert: RehearsalUpsert;
          times: ResolvedRehearsalTimes;
          existing: boolean;
        };

    // Cheap checks stay sequential; only events needing the LLM go in the pool.
    const processEvent = async (
      event: GoogleCalendarEvent,
    ): Promise<EventOutcome> => {
      if (event.status === "cancelled") return { kind: "cancelled" };

      const existing = dbByEventId.get(event.id);
      if (!hasGoogleUpdate(existing, event)) return { kind: "unchanged" };

      const extracted = await extractRehearsalFields(openAiKey, event);

      if (!extracted.is_rehearsal) {
        return {
          kind: "non_rehearsal",
          classifiedName: extracted.name,
          existingId: existing?.id,
        };
      }

      const times = resolveRehearsalTimes(event);
      if (!times) return { kind: "all_day_no_rule" };

      return {
        kind: "upsert",
        times,
        existing: Boolean(existing),
        upsert: {
          date: times.date,
          start_time: times.start_time,
          end_time: times.end_time,
          name: extracted.name,
          place: extracted.place,
          address: extracted.address || null,
          room: extracted.room || null,
          group_type: extracted.group_type,
          event_id: event.id,
          google_updated_at: event.updated,
        },
      };
    };

    const settled = await mapSettledWithConcurrency(
      googleEvents,
      EXTRACT_CONCURRENCY,
      processEvent,
    );

    googleEvents.forEach((event, index) => {
      const result = settled[index];

      if (result.status === "rejected") {
        const message =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        stats.errors.push({
          event_id: event.id,
          phase: "extract",
          message,
        });
        log("event_error", { event_id: event.id, phase: "extract", message });
        return;
      }

      const outcome = result.value;
      switch (outcome.kind) {
        case "cancelled":
          stats.skipped++;
          skippedCancelled++;
          log("event_skipped", { event_id: event.id, reason: "cancelled" });
          break;
        case "unchanged":
          stats.skipped++;
          skippedUnchanged++;
          log("event_skipped", { event_id: event.id, reason: "unchanged" });
          break;
        case "non_rehearsal":
          stats.skipped++;
          skippedNonRehearsal++;
          // A previously synced rehearsal that is now a concert/other must be removed.
          if (outcome.existingId) {
            reclassifiedDeleteIds.push(outcome.existingId);
          }
          log("event_skipped", {
            event_id: event.id,
            reason: "not_a_rehearsal",
            removes_existing: Boolean(outcome.existingId),
          });
          break;
        case "all_day_no_rule":
          stats.skipped++;
          skippedAllDayNoRule++;
          stats.errors.push({
            event_id: event.id,
            phase: "times",
            message:
              "All-day rehearsal without a matching time rule (expected e.g. Dimanche BT).",
          });
          log("event_skipped", {
            event_id: event.id,
            reason: "all_day_no_time_rule",
            all_day: isAllDayEvent(event.start),
          });
          break;
        case "upsert":
          upserts.push(outcome.upsert);
          log("event_queued", {
            event_id: event.id,
            group_type: outcome.upsert.group_type,
            date: outcome.times.date,
            start_time: outcome.times.start_time,
            end_time: outcome.times.end_time,
            all_day: outcome.times.all_day,
            time_rule: outcome.times.rule_id,
            operation: outcome.existing ? "update" : "create",
          });
          break;
      }
    });

    const removedFromCalendarIds = dbSynced
      .filter((row) => row.event_id && !googleEventIds.has(row.event_id))
      .map((row) => row.id);

    const deleteIds = [
      ...new Set([...removedFromCalendarIds, ...reclassifiedDeleteIds]),
    ];

    log("plan_computed", {
      upserts: upserts.length,
      deletes: deleteIds.length,
      deletes_removed_from_calendar: removedFromCalendarIds.length,
      deletes_reclassified_non_rehearsal: reclassifiedDeleteIds.length,
      skipped_total: stats.skipped,
      skipped_cancelled: skippedCancelled,
      skipped_unchanged: skippedUnchanged,
      skipped_non_rehearsal: skippedNonRehearsal,
      skipped_all_day_no_rule: skippedAllDayNoRule,
      errors: stats.errors.length,
    });

    if (mode === "dry-run") {
      const status = stats.errors.length > 0 ? "partial" : "success";
      console.log(
        JSON.stringify({
          phase: "dry-run",
          status,
          fetched: stats.fetched,
          upserts: upserts.length,
          deletes: deleteIds.length,
          errors: stats.errors.length,
        }),
      );

      return jsonResponse(
        responsePayload(mode, false, stats, null, upserts, {
          upserts: upserts.length,
          deletes: deleteIds.length,
        }),
      );
    }

    const hasSuccessfulRun = await hasSuccessfulRealRun(supabase);
    const silencePush =
      mode === "test" || !hasSuccessfulRun || wantsSilence(req);
    log("write_start", {
      mode,
      upserts: upserts.length,
      deletes: deleteIds.length,
      silence_push: silencePush,
    });

    // Upserts go in batches of WRITE_BATCH_SIZE; deletes ride with the first
    // call. A failed batch is recorded and the others still run.
    const upsertBatches = chunk(upserts, WRITE_BATCH_SIZE);
    const writeCalls = upsertBatches.length > 0 ? upsertBatches : [[]];
    let writeFailures = 0;

    for (const [index, batch] of writeCalls.entries()) {
      const { data: writeResult, error: writeError } = await supabase.rpc(
        "rehearsals_sync_write",
        {
          p_upserts: batch,
          p_delete_ids: index === 0 ? deleteIds : [],
          p_silence_push: silencePush,
        },
      );

      if (writeError) {
        writeFailures++;
        stats.errors.push({
          phase: "write",
          message: `Batch ${index + 1}/${writeCalls.length}: ${writeError.message}`,
        });
        log("write_failed", {
          mode,
          batch: index + 1,
          batches: writeCalls.length,
          message: writeError.message,
        });
        continue;
      }

      const counts = (writeResult ?? {}) as {
        created?: number;
        updated?: number;
        deleted?: number;
      };
      stats.created += counts.created ?? 0;
      stats.updated += counts.updated ?? 0;
      stats.deleted += counts.deleted ?? 0;
    }

    if (writeFailures > 0) {
      await finalizeSyncLog(
        supabase,
        logId,
        stats,
        writeFailures === writeCalls.length ? "failed" : "partial",
      );
      return jsonResponse(
        responsePayload(mode, true, stats, logId, upserts),
        500,
      );
    }

    const finalStatus = stats.errors.length > 0 ? "partial" : "success";
    await finalizeSyncLog(supabase, logId, stats, finalStatus);

    console.log(
      JSON.stringify({
        phase: "complete",
        mode,
        status: finalStatus,
        fetched: stats.fetched,
        created: stats.created,
        updated: stats.updated,
        deleted: stats.deleted,
        skipped: stats.skipped,
        errors: stats.errors.length,
        silencePush,
      }),
    );

    return jsonResponse(responsePayload(mode, true, stats, logId, upserts));
  } catch (error) {
    stats.errors.push({
      phase: "google",
      message: error instanceof Error ? error.message : String(error),
    });
    log("fatal", {
      mode,
      message: error instanceof Error ? error.message : String(error),
    });

    if (supabase) {
      await finalizeSyncLog(supabase, logId, stats, "failed");
    }

    return jsonResponse(responsePayload(mode, false, stats, logId, []), 500);
  }
});

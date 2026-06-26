import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

type CheckResult = { name: string; passed: boolean; detail?: string };

const results: CheckResult[] = [];

function loadRootEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

function check(name: string, passed: boolean, detail?: string) {
  results.push({ name, passed, detail });
  console.log(
    `${passed ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`,
  );
}

async function safe(name: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (error) {
    check(name, false, `threw: ${(error as Error).message}`);
  }
}

loadRootEnv();

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SECRET = process.env.SYNC_CRON_SECRET;

if (!SUPABASE_URL || !SERVICE_ROLE || !ANON || !SECRET) {
  console.error(
    "Missing required env. Need: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY), SYNC_CRON_SECRET",
  );
  process.exit(1);
}

const config = {
  supabaseUrl: SUPABASE_URL,
  serviceRole: SERVICE_ROLE,
  anon: ANON,
  secret: SECRET,
};

const db = createClient(config.supabaseUrl, config.serviceRole);

const VALID_GROUPS = [
  "Orchestre",
  "Hommes",
  "Femmes",
  "Jeunes/Enfants",
  "Choeur complet",
  "Tous",
];

async function invokeSync(mode: "test" | "dry-run"): Promise<any> {
  const res = await fetch(
    `${config.supabaseUrl}/functions/v1/sync-rehearsals-from-calendar?mode=${mode}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.anon}`,
        "x-sync-secret": config.secret,
      },
      body: "{}",
    },
  );

  const body = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  console.log("Rehearsal Sync - 60-day end-to-end test\n");

  let manualBefore: any[] = [];
  await safe("snapshot manual rehearsals (before)", async () => {
    const { data, error } = await db
      .from("rehearsals")
      .select("*")
      .is("event_id", null);
    if (error) throw error;
    manualBefore = data ?? [];
    check(
      "snapshot manual rehearsals (before)",
      true,
      `${manualBefore.length} rows`,
    );
  });

  let syncedBefore: any[] = [];
  await safe("snapshot synced rehearsals (before)", async () => {
    const { data, error } = await db
      .from("rehearsals")
      .select("*")
      .not("event_id", "is", null);
    if (error) throw error;
    syncedBefore = data ?? [];
    check(
      "snapshot synced rehearsals (before)",
      true,
      `${syncedBefore.length} rows`,
    );
  });

  let report: any = null;
  await safe("invoke edge function (mode=test)", async () => {
    report = await invokeSync("test");
    check(
      "invoke edge function (mode=test)",
      true,
      `fetched=${report.counts?.fetched} created=${report.counts?.created} updated=${report.counts?.updated} deleted=${report.counts?.deleted} errors=${report.errors?.length ?? 0}`,
    );
  });

  await safe("sync_logs row exists with valid status", async () => {
    if (!report?.sync_log_id) throw new Error("no sync_log_id in report");
    const { data, error } = await db
      .from("rehearsal_sync_logs")
      .select("*")
      .eq("id", report.sync_log_id)
      .single();
    if (error) throw error;
    check(
      "sync_logs row exists with valid status",
      ["success", "partial"].includes(data.status),
      `status=${data.status} errors=${(data.errors ?? []).length}`,
    );
  });

  await safe("manual rehearsals untouched (count)", async () => {
    const { data, error } = await db
      .from("rehearsals")
      .select("*")
      .is("event_id", null);
    if (error) throw error;
    const after = data ?? [];
    check(
      "manual rehearsals untouched (count)",
      after.length === manualBefore.length,
      `before=${manualBefore.length} after=${after.length}`,
    );
  });

  await safe("manual rehearsals untouched (ids)", async () => {
    const { data, error } = await db
      .from("rehearsals")
      .select("id")
      .is("event_id", null);
    if (error) throw error;
    const afterIds = new Set((data ?? []).map((row) => row.id));
    const allPresent = manualBefore.every((before) => afterIds.has(before.id));
    check("manual rehearsals untouched (ids)", allPresent);
  });

  await safe("synced rows have event_id + google_updated_at", async () => {
    const { data, error } = await db
      .from("rehearsals")
      .select("id, event_id, google_updated_at")
      .not("event_id", "is", null);
    if (error) throw error;
    const missing = (data ?? []).filter(
      (row) => !row.event_id || !row.google_updated_at,
    );
    check(
      "synced rows have event_id + google_updated_at",
      missing.length === 0,
      `${missing.length} rows missing fields`,
    );
  });

  await safe("event_id uniqueness", async () => {
    const { data, error } = await db
      .from("rehearsals")
      .select("event_id")
      .not("event_id", "is", null);
    if (error) throw error;
    const ids = (data ?? []).map((row) => row.event_id);
    const dupes = ids.filter((id, index) => ids.indexOf(id) !== index);
    check(
      "event_id uniqueness",
      dupes.length === 0,
      dupes.length
        ? `duplicates: ${[...new Set(dupes)].join(", ")}`
        : "all unique",
    );
  });

  await safe("group_type values valid", async () => {
    const { data, error } = await db
      .from("rehearsals")
      .select("id, group_type")
      .not("event_id", "is", null);
    if (error) throw error;
    const bad = (data ?? []).filter(
      (row) => !VALID_GROUPS.includes(row.group_type),
    );
    check(
      "group_type values valid",
      bad.length === 0,
      bad.length ? `${bad.length} invalid` : "",
    );
  });

  await safe("date/time format sanity", async () => {
    const { data, error } = await db
      .from("rehearsals")
      .select("id, date, start_time, end_time")
      .not("event_id", "is", null);
    if (error) throw error;
    const bad = (data ?? []).filter(
      (row) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
        !/^\d{2}:\d{2}/.test(row.start_time) ||
        !/^\d{2}:\d{2}/.test(row.end_time),
    );
    check(
      "date/time format sanity",
      bad.length === 0,
      bad.length ? `${bad.length} malformed` : "",
    );
  });

  await safe("idempotency (2nd run: 0 creates, 0 deletes)", async () => {
    const second = await invokeSync("test");
    const noWrites =
      (second.counts?.created ?? 0) === 0 &&
      (second.counts?.deleted ?? 0) === 0;
    check(
      "idempotency (2nd run: 0 creates, 0 deletes)",
      noWrites,
      `created=${second.counts?.created} updated=${second.counts?.updated} deleted=${second.counts?.deleted}`,
    );
  });

  await safe("future-only window respected (informational)", async () => {
    const todayParis = new Date().toLocaleDateString("fr-CA", {
      timeZone: "Europe/Paris",
    });
    const { data, error } = await db
      .from("rehearsals")
      .select("id, date")
      .not("event_id", "is", null)
      .lt("date", todayParis);
    if (error) throw error;
    check(
      "future-only window respected (informational)",
      true,
      `${(data ?? []).length} past synced rows preserved from prior runs (expected)`,
    );
  });

  console.log("\n" + "=".repeat(60));
  const passed = results.filter((result) => result.passed).length;
  const failed = results.filter((result) => !result.passed).length;
  console.log(
    `SUMMARY: ${passed} passed, ${failed} failed (of ${results.length})`,
  );
  console.log("=".repeat(60));

  if (failed > 0) {
    console.log("\nFailed checks:");
    results
      .filter((result) => !result.passed)
      .forEach((result) =>
        console.log(
          `  FAIL ${result.name}${result.detail ? ` - ${result.detail}` : ""}`,
        ),
      );
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("FATAL (uncaught):", error);
  process.exit(1);
});

// Watches production every 15 minutes and pushes alerts to the superadmins'
// phones through the mobile app (FCM). Refs #364.
//
// Checks (rules and thresholds in checks.ts):
// - the rehearsal calendar sync and the Drive index sync: latest cron run
//   failed, stuck or too old;
// - pg_cron jobs that failed, and pg_net calls (edge functions called by cron
//   jobs and triggers) that failed, in the last 30 minutes;
// - the website and the admin answer over HTTP.
//
// Each problem is pushed once when it starts, again once a day while it
// lasts, and once when it ends; `ops_alerts` holds that state. Only phones
// registered in `push_devices` by a superadmin's session receive anything.
//
// Body (all optional): `{ "dry_run": true }` evaluates and returns what it
// would push, writing and sending nothing; `{ "test": true }` sends one test
// push to the superadmins' phones. Caller: the pg_cron job `check-ops-alerts`
// (internal secret) or anyone holding that secret; nothing else.
import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

import { requireInternalSecret } from "../_shared/caller-auth.ts";
import {
  getAccessToken,
  readServiceAccount,
  sendToToken,
  type TokenMessage,
} from "../_shared/fcm.ts";
import {
  decide,
  evaluate,
  isUp,
  markNotified,
  message,
  type DbFacts,
  type Notification,
  type SiteProbe,
  type StoredAlert,
} from "./checks.ts";

const WINDOW_MINUTES = 30;
const PROBE_TIMEOUT_MS = 10_000;
const PROBE_RETRY_DELAY_MS = 5_000;

const WEBSITE_URL =
  Deno.env.get("ALERT_WEBSITE_URL") ?? "https://www.lebontemperament.com/";
const ADMIN_URL =
  Deno.env.get("ALERT_ADMIN_URL") ??
  "https://admin.lebontemperament.com/auth/login";

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
      source: "check-ops-alerts",
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

async function probeOnce(url: string): Promise<SiteProbe> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "lbt-ops-alerts/1 (+supabase edge function)" },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    await res.body?.cancel();
    return { url, status: res.status };
  } catch (err) {
    const name = (err as Error).name;
    return {
      url,
      status: null,
      error: name === "TimeoutError" ? "délai dépassé" : "erreur réseau",
    };
  }
}

/** A site counts as down only if a second try, 5 s later, fails too. */
async function probe(url: string): Promise<SiteProbe> {
  const first = await probeOnce(url);
  if (isUp(first.status)) return first;
  await new Promise((r) => setTimeout(r, PROBE_RETRY_DELAY_MS));
  return probeOnce(url);
}

/** Device tokens of every superadmin, read at send time so a lost role stops
 * the pushes at once. */
async function superadminTokens(supabase: SupabaseClient): Promise<string[]> {
  const { data: admins, error: adminsError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "superadmin");
  if (adminsError) throw new Error(`profiles: ${adminsError.message}`);
  const ids = (admins ?? []).map((p: { id: string }) => p.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("push_devices")
    .select("token")
    .in("user_id", ids);
  if (error) throw new Error(`push_devices: ${error.message}`);
  return (data ?? []).map((d: { token: string }) => d.token);
}

/** Sends one push to every token; returns how many phones got it and drops
 * the tokens FCM says are gone. */
async function pushToSuperadmins(
  supabase: SupabaseClient,
  tokens: string[],
  msg: TokenMessage,
): Promise<number> {
  if (tokens.length === 0) return 0;
  const sa = readServiceAccount();
  const accessToken = await getAccessToken(sa);
  const results = await Promise.all(
    tokens.map((t) => sendToToken(sa, accessToken, t, msg)),
  );
  const gone = tokens.filter((_, i) => results[i] === "unregistered");
  if (gone.length > 0) {
    const { error } = await supabase
      .from("push_devices")
      .delete()
      .in("token", gone);
    if (error) log("drop_tokens_failed", { error: error.message });
    // Removed from the list the caller keeps using for this run.
    for (const t of gone) tokens.splice(tokens.indexOf(t), 1);
  }
  return results.filter((r) => r === "sent").length;
}

Deno.serve(async (req) => {
  const refused = requireInternalSecret(req);
  if (refused) return refused;
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const dryRun = body.dry_run === true;
  const now = new Date();

  try {
    const supabase = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    if (body.test === true) {
      const tokens = await superadminTokens(supabase);
      const delivered = await pushToSuperadmins(supabase, tokens, {
        title: "Test des alertes",
        body: "Les alertes de production arrivent bien sur ce téléphone.",
        tag: "ops_test",
        data: { type: "alert", key: "test" },
      });
      log("test", { devices: tokens.length, delivered });
      return jsonResponse({ test: true, devices: tokens.length, delivered });
    }

    const [factsResult, website, admin] = await Promise.all([
      supabase.rpc("ops_alert_facts", { p_window_minutes: WINDOW_MINUTES }),
      probe(WEBSITE_URL),
      probe(ADMIN_URL),
    ]);
    if (factsResult.error) {
      throw new Error(`ops_alert_facts: ${factsResult.error.message}`);
    }
    const facts = factsResult.data as DbFacts;
    const findings = evaluate(facts, { website, admin }, now, WINDOW_MINUTES);

    const { data: rows, error: rowsError } = await supabase
      .from("ops_alerts")
      .select(
        "key, status, title, body, first_fired_at, last_notified_at, notified_count, resolved_at",
      );
    if (rowsError) throw new Error(`ops_alerts: ${rowsError.message}`);
    const stored = new Map(
      (rows as StoredAlert[]).map((r) => [r.key, r] as const),
    );

    const decisions = findings.map((f) => ({
      finding: f,
      ...decide(stored.get(f.key), f, now),
    }));
    const firing = findings.filter((f) => f.firing).map((f) => f.key);

    if (dryRun) {
      return jsonResponse({
        dry_run: true,
        devices: (await superadminTokens(supabase)).length,
        firing,
        findings,
        would_notify: decisions
          .filter((d) => d.notify)
          .map((d) => ({ key: d.finding.key, notify: d.notify })),
        probes: { website, admin },
      });
    }

    const toNotify = decisions.filter((d) => d.notify && d.next);
    const tokens = toNotify.length > 0 ? await superadminTokens(supabase) : [];
    const sent: { key: string; notify: Notification; delivered: number }[] = [];
    const toStore: StoredAlert[] = [];

    for (const d of decisions) {
      if (!d.next) continue;
      let next = d.next;
      if (d.notify) {
        const { title, body: text } = message(next, d.notify, now);
        const delivered = await pushToSuperadmins(supabase, tokens, {
          title,
          body: text,
          tag: `ops_${next.key}`,
          data: { type: "alert", key: next.key, state: d.notify },
        });
        sent.push({ key: next.key, notify: d.notify, delivered });
        if (delivered > 0) next = markNotified(next, d.notify, now);
      }
      toStore.push(next);
    }

    if (toStore.length > 0) {
      const { error } = await supabase.from("ops_alerts").upsert(
        toStore.map((a) => ({ ...a, updated_at: now.toISOString() })),
        { onConflict: "key" },
      );
      if (error) throw new Error(`ops_alerts upsert: ${error.message}`);
    }

    log("checked", { firing, sent, devices: tokens.length });
    return jsonResponse({ firing, sent, devices: tokens.length });
  } catch (err) {
    log("error", { error: (err as Error).message });
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

// Concert pushes for visitors of the app (#593): once a day, the announcement
// of each new concert and a reminder two days before, sent to the FCM topic
// `public_concerts`. The app subscribes to it while nobody is signed in and
// the visitor's « Prochains concerts » switch is on; no token or personal
// data is stored. Members get concerts through `all_users` instead.
//
// What is due is decided in plan.ts; public_concert_pushes remembers what
// went out, so each push is sent once (a failed send is retried the next day).
//
// Body (all optional): `{ "dry_run": true }` returns what it would send,
// sending and writing nothing. Caller: the pg_cron job notify-public-concerts
// (internal secret) or anyone holding that secret; nothing else.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { requireInternalSecret } from "../_shared/caller-auth.ts";
import {
  getAccessToken,
  readServiceAccount,
  sendToTopic,
} from "../_shared/fcm.ts";
import { type ConcertRow, parisToday, plan } from "./plan.ts";

const TOPIC = "public_concerts";

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
      source: "notify-public-concerts",
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

Deno.serve(async (req) => {
  const refused = requireInternalSecret(req);
  if (refused) return refused;
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const dryRun = body.dry_run === true;
  const today = parisToday(new Date());

  try {
    const supabase = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: concerts, error: concertsError } = await supabase
      .from("concerts")
      .select("id, name, date, time, place, venue_name, city")
      .gt("date", today);
    if (concertsError) throw new Error(`concerts: ${concertsError.message}`);

    const ids = (concerts ?? []).map((c: { id: string }) => c.id);
    const sent = new Set<string>();
    if (ids.length > 0) {
      const { data: rows, error } = await supabase
        .from("public_concert_pushes")
        .select("concert_id, kind")
        .in("concert_id", ids);
      if (error) throw new Error(`public_concert_pushes: ${error.message}`);
      for (const r of rows as { concert_id: string; kind: string }[]) {
        sent.add(`${r.concert_id}:${r.kind}`);
      }
    }

    const due = plan(concerts as ConcertRow[], sent, today);
    if (dryRun || due.length === 0) {
      log("planned", { today, dry_run: dryRun, due: due.length });
      return jsonResponse({
        today,
        dry_run: dryRun,
        due: due.map((p) => ({
          concert_id: p.concert.id,
          kind: p.kind,
          title: p.title,
          body: p.body,
        })),
      });
    }

    const sa = readServiceAccount();
    const accessToken = await getAccessToken(sa);
    let delivered = 0;
    for (const push of due) {
      const ok = await sendToTopic(sa, accessToken, TOPIC, {
        title: push.title,
        body: push.body,
        tag: `public_concert_${push.concert.id}`,
        data: { type: "concert", id: push.concert.id },
      });
      if (!ok) continue;
      delivered++;
      const { error } = await supabase
        .from("public_concert_pushes")
        .upsert({ concert_id: push.concert.id, kind: push.kind });
      if (error) {
        log("record_failed", {
          concert_id: push.concert.id,
          error: error.message,
        });
      }
    }
    log("sent", { today, due: due.length, delivered });
    return jsonResponse({ today, due: due.length, delivered });
  } catch (err) {
    log("error", { error: (err as Error).message });
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

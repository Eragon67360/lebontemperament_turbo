// Pushes signalements to phones through the mobile app (FCM):
// - a new report goes to the superadmins (not to its author);
// - a superadmin's answer goes to the report's author, as « Réponse à votre
//   signalement »;
// - the author's own answer goes back to the superadmins.
// Who gets what is decided in plan.ts.
//
// Caller: the database trigger notify_bug_report_push (migration
// 20261008090000), with the internal secret and the body
// `{ "kind": "report" | "message", "id": "<row id>" }`. The function reads
// the rows itself, so a caller can't choose who is pushed or what it says.
import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

import { requireInternalSecret } from "../_shared/caller-auth.ts";
import {
  getAccessToken,
  readServiceAccount,
  sendToToken,
} from "../_shared/fcm.ts";
import {
  planNewMessage,
  planNewReport,
  type Audience,
  type Message,
  type Person,
  type Plan,
  type Report,
} from "./plan.ts";
import { requireServiceKey } from "../_shared/supabase-keys.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function log(event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ fn: "notify-bug-report", event, ...data }));
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function person(
  supabase: SupabaseClient,
  id: string,
): Promise<Person | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .eq("id", id)
    .maybeSingle();
  return (data as Person | null) ?? null;
}

async function report(
  supabase: SupabaseClient,
  id: string,
): Promise<Report | null> {
  const { data, error } = await supabase
    .from("bug_reports")
    .select("id, title, reported_by")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`bug_reports: ${error.message}`);
  return (data as Report | null) ?? null;
}

async function plan(
  supabase: SupabaseClient,
  kind: string,
  id: string,
): Promise<Plan | null> {
  if (kind === "report") {
    const r = await report(supabase, id);
    if (!r) return null;
    return planNewReport(r, await person(supabase, r.reported_by));
  }
  const { data, error } = await supabase
    .from("bug_messages")
    .select("id, bug_report_id, sender_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`bug_messages: ${error.message}`);
  if (!data) return null;
  const m = data as Message;
  const r = await report(supabase, m.bug_report_id);
  if (!r) return null;
  return planNewMessage(r, m, await person(supabase, m.sender_id));
}

/** Device tokens of the audience, read at send time so a lost role stops the
 * pushes at once. */
async function tokensFor(
  supabase: SupabaseClient,
  audience: Audience,
): Promise<string[]> {
  let userIds: string[];
  if (audience.kind === "member") {
    userIds = [audience.userId];
  } else {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "superadmin");
    if (error) throw new Error(`profiles: ${error.message}`);
    userIds = (data ?? [])
      .map((p: { id: string }) => p.id)
      .filter((uid: string) => uid !== audience.except);
  }
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("push_devices")
    .select("token")
    .in("user_id", userIds);
  if (error) throw new Error(`push_devices: ${error.message}`);
  return (data ?? []).map((d: { token: string }) => d.token);
}

Deno.serve(async (req) => {
  const refused = requireInternalSecret(req);
  if (refused) return refused;

  let kind: unknown;
  let id: unknown;
  try {
    ({ kind, id } = await req.json());
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
  if (
    (kind !== "report" && kind !== "message") ||
    typeof id !== "string" ||
    !UUID.test(id)
  ) {
    return jsonResponse({ error: "Expected { kind, id }" }, 400);
  }

  try {
    const supabase = createClient(
      requireEnv("SUPABASE_URL"),
      requireServiceKey(),
      { auth: { persistSession: false } },
    );

    const p = await plan(supabase, kind, id);
    if (!p) {
      log("not_found", { kind, id });
      return jsonResponse({ sent: 0, reason: "not_found" });
    }

    const tokens = await tokensFor(supabase, p.audience);
    if (tokens.length === 0) {
      log("no_device", { kind, id, audience: p.audience.kind });
      return jsonResponse({ sent: 0, reason: "no_device" });
    }

    const sa = readServiceAccount();
    const accessToken = await getAccessToken(sa);
    const results = await Promise.all(
      tokens.map((t) => sendToToken(sa, accessToken, t, p.message)),
    );

    const gone = tokens.filter((_, i) => results[i] === "unregistered");
    if (gone.length > 0) {
      const { error } = await supabase
        .from("push_devices")
        .delete()
        .in("token", gone);
      if (error) log("drop_tokens_failed", { error: error.message });
    }

    const sent = results.filter((r) => r === "sent").length;
    log("pushed", {
      kind,
      id,
      audience: p.audience.kind,
      devices: tokens.length,
      sent,
      dropped: gone.length,
    });
    return jsonResponse({ sent, devices: tokens.length });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    log("error", { kind, id, error });
    return jsonResponse({ error: "Push failed" }, 500);
  }
});

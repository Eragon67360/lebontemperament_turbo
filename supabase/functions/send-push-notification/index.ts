import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/caller-auth.ts";
import {
  getAccessToken,
  readServiceAccount,
  sendToToken,
  type ServiceAccount,
} from "../_shared/fcm.ts";
import { requireServiceKey } from "../_shared/supabase-keys.ts";
import {
  audienceFromBody,
  eventGroupIds,
  planGroupPushes,
  pushCondition,
} from "./target.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FRENCH_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** Format ISO date string to French: "2026-02-08" → "8 février 2026" */
function formatDateFR(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;
  const [, y, m, d] = match;
  const month = FRENCH_MONTHS[parseInt(m, 10) - 1];
  if (!month) return dateStr;
  return `${parseInt(d, 10)} ${month} ${y}`;
}

/** Format time string "14:30" → "14h30" */
function formatTimeFR(timeStr: string | null | undefined): string {
  if (!timeStr || typeof timeStr !== "string") return "";
  const t = timeStr.trim();
  if (/^\d{1,2}:\d{2}/.test(t)) {
    const [h, min] = t.split(":");
    return `${parseInt(h, 10)}h${min ?? "00"}`;
  }
  return t;
}

function getNotificationContent(
  table: string,
  operation: string,
  record: Record<string, unknown>,
): { title: string; body: string } {
  const name =
    (record.name as string) ?? (record.title as string) ?? "Événement";
  const dateRaw = (record.date as string) ?? (record.date_from as string) ?? "";
  const dateFR = formatDateFR(dateRaw);
  const timeRaw =
    (record.time as string) ?? (record.start_time as string) ?? "";
  const timeFR = formatTimeFR(timeRaw);
  const place = (record.place as string) ?? (record.location as string) ?? "";

  const bodyParts = [name, dateFR, timeFR, place].filter(Boolean);
  const body = bodyParts.join(" · ") || name;

  if (operation === "INSERT") {
    switch (table) {
      case "rehearsals":
        return { title: "Nouvelle répétition ajoutée", body };
      case "events":
        return { title: "Nouvel événement ajouté", body };
      case "concerts":
        return { title: "Nouveau concert ajouté", body };
      default:
        return { title: "Nouvelle notification", body: String(name) };
    }
  }

  if (operation === "UPDATE") {
    switch (table) {
      case "rehearsals":
        return { title: "Répétition modifiée", body };
      case "events":
        return { title: "Événement modifié", body };
      case "concerts":
        return { title: "Concert modifié", body };
      default:
        return { title: "Notification mise à jour", body: String(name) };
    }
  }

  if (operation === "DELETE") {
    switch (table) {
      case "rehearsals":
        return { title: "Répétition supprimée", body: String(name) };
      case "events":
        return { title: "Événement supprimé", body: String(name) };
      case "concerts":
        return { title: "Concert supprimé", body: String(name) };
      default:
        return { title: "Notification supprimée", body: String(name) };
    }
  }

  return { title: "Notification", body: String(name) };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function log(event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ fn: "send-push-notification", event, ...data }));
}

/** 42P01 / PGRST205: a table of a migration not applied on this project. */
function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new Error("SUPABASE_URL is not set");
  return createClient(url, requireServiceKey(), {
    auth: { persistSession: false },
  });
}

/**
 * The groups an event is for, read now. `null` when the event is gone
 * (deleted before this push ran: nothing to announce), `[]` when it is for
 * every member or the groups' migration isn't applied on this project.
 * Throws on any other failed read: a group event must never fall back to the
 * topics.
 */
async function currentEventGroups(
  supabase: SupabaseClient,
  eventId: string,
): Promise<string[] | null> {
  const event = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (event.error) throw new Error(`events: ${event.error.message}`);
  if (!event.data) return null;
  const rows = await supabase
    .from("event_audiences")
    .select("group_id")
    .eq("event_id", eventId);
  if (rows.error) {
    if (isMissingTable(rows.error)) return [];
    throw new Error(`event_audiences: ${rows.error.message}`);
  }
  return (rows.data ?? []).map((r: { group_id: string }) => r.group_id);
}

/**
 * Sends an event reserved for groups to the devices of their members, one
 * push per device (never a topic). Tokens FCM reports as gone are dropped.
 */
async function sendToGroups(
  supabase: SupabaseClient,
  sa: ServiceAccount,
  eventId: string,
  groupIds: string[],
  title: string,
  body: string,
): Promise<{ devices: number; sent: number; dropped: number }> {
  const [groups, memberships] = await Promise.all([
    supabase.from("member_groups").select("id, name").in("id", groupIds),
    supabase
      .from("member_group_members")
      .select("group_id, profile_id")
      .in("group_id", groupIds),
  ]);
  if (groups.error) throw new Error(`member_groups: ${groups.error.message}`);
  if (memberships.error) {
    throw new Error(`member_group_members: ${memberships.error.message}`);
  }
  const members = [
    ...new Set(
      (memberships.data ?? []).map((m: { profile_id: string }) => m.profile_id),
    ),
  ];
  if (members.length === 0) return { devices: 0, sent: 0, dropped: 0 };

  const devices = await supabase
    .from("push_devices")
    .select("token, user_id")
    .in("user_id", members);
  if (devices.error) throw new Error(`push_devices: ${devices.error.message}`);

  const pushes = planGroupPushes({
    groupIds,
    groupNames: Object.fromEntries(
      (groups.data ?? []).map((g: { id: string; name: string }) => [
        g.id,
        g.name,
      ]),
    ),
    memberships: memberships.data ?? [],
    devices: devices.data ?? [],
    title,
  });
  if (pushes.length === 0) return { devices: 0, sent: 0, dropped: 0 };

  const accessToken = await getAccessToken(sa);
  const results = await Promise.all(
    pushes.map((p) =>
      sendToToken(sa, accessToken, p.token, {
        title: p.title,
        body,
        tag: `event-${eventId}`,
        data: { type: "event", id: eventId },
      }),
    ),
  );
  const gone = pushes
    .filter((_, i) => results[i] === "unregistered")
    .map((p) => p.token);
  if (gone.length > 0) {
    const { error } = await supabase
      .from("push_devices")
      .delete()
      .in("token", gone);
    if (error) log("drop_tokens_failed", { error: error.message });
  }
  return {
    devices: pushes.length,
    sent: results.filter((r) => r === "sent").length,
    dropped: gone.length,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only the database trigger may broadcast to the members' phones.
  const refused = requireInternalSecret(req, corsHeaders);
  if (refused) return refused;

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const table = (body.table as string) ?? "";
    const operation = (body.operation as string) ?? "INSERT";
    const record = (body.record as Record<string, unknown>) ?? {};
    // Sent on UPDATE since 20261011190000: a rehearsal that changes group
    // also tells the group it leaves.
    const oldRecord = (body.old_record as Record<string, unknown>) ?? null;

    if (!table || !["rehearsals", "events", "concerts"].includes(table)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing table" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const id = (record.id as string) ?? "";
    const { title, body: bodyText } = getNotificationContent(
      table,
      operation,
      record,
    );

    if (!Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON")) {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }
    const sa = readServiceAccount();

    // An event reserved for groups goes to their members' devices only.
    if (table === "events") {
      const supabase = adminClient();
      const current =
        operation === "DELETE" ? null : await currentEventGroups(supabase, id);
      if (operation !== "DELETE" && current === null) {
        log("event_gone", { operation, id });
        return jsonResponse({ sent: 0, reason: "event_gone" });
      }
      const groupIds = eventGroupIds(audienceFromBody(body.audience), current);
      if (groupIds.length > 0) {
        const result = await sendToGroups(
          supabase,
          sa,
          id,
          groupIds,
          title,
          bodyText,
        );
        log("pushed_to_groups", {
          operation,
          id,
          groups: groupIds.length,
          ...result,
        });
        return jsonResponse({ success: true, ...result });
      }
    }

    const accessToken = await getAccessToken(sa);

    const condition = pushCondition(table, record, oldRecord);
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
    const fcmBody = {
      message: {
        condition,
        notification: { title, body: bodyText },
        // Background pushes are shown by the system: without a channel they
        // land in Android's "Miscellaneous" channel, silent and unranked.
        // "fcm_push" is the channel the app creates at start-up
        // (NotificationService._createRealtimeNotificationChannels).
        android: { notification: { channel_id: "fcm_push" } },
        data: {
          type: table.slice(0, -1),
          id: String(id),
        },
      },
    };

    const fcmRes = await fetch(fcmUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fcmBody),
    });

    if (!fcmRes.ok) {
      const errText = await fcmRes.text();
      console.error("FCM error:", fcmRes.status, errText);
      return new Response(
        JSON.stringify({ error: "FCM send failed", details: errText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push-notification error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

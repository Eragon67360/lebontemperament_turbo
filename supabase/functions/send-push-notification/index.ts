import { serve as serveHttp } from "https://deno.land/std@0.177.0/http/server.ts";
import * as jose from "npm:jose@5.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

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

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const key = await jose.importPKCS8(
    sa.private_key.replace(/\\n/g, "\n"),
    "RS256",
  );
  const jwt = await new jose.SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(Math.floor(Date.now() / 1000))
    .setExpirationTime("1h")
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth2 token failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

serveHttp(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    const saJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const sa = JSON.parse(saJson) as ServiceAccount;
    const accessToken = await getAccessToken(sa);

    const topic = "all_users";
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
    const fcmBody = {
      message: {
        topic,
        notification: { title, body: bodyText },
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

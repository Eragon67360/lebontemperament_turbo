import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OSRM_ROUTE_BASE = "https://router.project-osrm.org/route/v1/driving";

interface RecipientRow {
  id: string;
  latitude: number;
  longitude: number;
  sort_order: number;
  phone_number: string | null;
  label: string;
  public_token: string;
  delivered_at: string | null;
}

async function fetchOSRMLegDurations(
  coords: { lng: number; lat: number }[],
): Promise<number[] | null> {
  if (coords.length < 2) return [];
  const coordsStr = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const url = `${OSRM_ROUTE_BASE}/${coordsStr}?overview=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{ legs?: Array<{ duration?: number }> }>;
    };
    const route = data.routes?.[0];
    if (data.code !== "Ok" || !route?.legs) return null;
    const durations = route.legs
      .map((leg) => (typeof leg.duration === "number" ? leg.duration : null))
      .filter((d): d is number => d != null);
    return durations.length === route.legs.length ? durations : null;
  } catch {
    return null;
  }
}

/** Format time in Europe/Paris timezone as HH:MM */
function formatTimeHHMMParis(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Paris",
  });
}

/**
 * Round to nearest 15 min, then return a 30-min window (rounded ±15 min).
 * e.g. 09:29 → 09:15 – 09:45
 */
function getRoundedTimeRange(scheduledAt: Date): { start: Date; end: Date } {
  const quarterMs = 15 * 60 * 1000;
  const rounded = new Date(
    Math.round(scheduledAt.getTime() / quarterMs) * quarterMs,
  );
  return {
    start: new Date(rounded.getTime() - 15 * 60 * 1000),
    end: new Date(rounded.getTime() + 15 * 60 * 1000),
  };
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await req.json();
    const { deliveryId, startLat, startLng, sendSms } = body as {
      deliveryId: string;
      startLat?: number;
      startLng?: number;
      sendSms?: boolean;
    };

    if (!deliveryId) {
      return new Response(JSON.stringify({ error: "Missing deliveryId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: recipients, error } = await supabaseAdmin
      .from("delivery_recipients")
      .select(
        "id, latitude, longitude, sort_order, phone_number, label, public_token, delivered_at",
      )
      .eq("delivery_id", deliveryId)
      .order("sort_order");

    if (error) throw error;
    if (!recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ message: "No recipients found." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const withCoords = recipients.filter(
      (r) =>
        r.latitude != null &&
        r.longitude != null &&
        typeof r.latitude === "number" &&
        typeof r.longitude === "number",
    ) as RecipientRow[];

    const startTime = new Date();
    const hasDriver = startLat != null && startLng != null;

    const coordsList: { lng: number; lat: number }[] = hasDriver
      ? [
          { lng: startLng!, lat: startLat! },
          ...withCoords.map((r) => ({ lng: r.longitude, lat: r.latitude })),
        ]
      : withCoords.map((r) => ({ lng: r.longitude, lat: r.latitude }));

    const legDurations = await fetchOSRMLegDurations(coordsList);

    const scheduledAts: { id: string; scheduledAt: string }[] = [];
    let accumulatedSeconds = 0;

    for (let i = 0; i < withCoords.length; i++) {
      const recipient = withCoords[i];
      // legs[0]=driver->r1, legs[1]=r1->r2, ... When no driver, legs[0]=r1->r2 so r1 gets "now".
      const legIndex = hasDriver ? i : i - 1;
      const durationSeconds =
        legIndex >= 0 && legDurations?.[legIndex] != null
          ? legDurations[legIndex]
          : 0;
      accumulatedSeconds += durationSeconds;
      const scheduledAt = new Date(
        startTime.getTime() + accumulatedSeconds * 1000,
      );
      scheduledAts.push({
        id: recipient.id,
        scheduledAt: scheduledAt.toISOString(),
      });
    }

    for (const { id, scheduledAt } of scheduledAts) {
      await supabaseAdmin
        .from("delivery_recipients")
        .update({ scheduled_at: scheduledAt })
        .eq("id", id)
        .eq("delivery_id", deliveryId);
    }

    let smsSentCount = 0;
    if (sendSms) {
      const siteUrl = Deno.env.get("SITE_URL") ?? "";
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;
      const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const basicAuth = "Basic " + btoa(`${accountSid}:${authToken}`);
      const baseUrl = siteUrl.replace(/\/$/, "");

      for (const { id, scheduledAt } of scheduledAts) {
        const recipient = withCoords.find((r) => r.id === id);
        if (!recipient?.phone_number?.trim()) continue;
        if (recipient.delivered_at != null) continue; // Skip already delivered

        const scheduledDate = new Date(scheduledAt);
        const { start: startRange, end: endRange } =
          getRoundedTimeRange(scheduledDate);
        const startStr = formatTimeHHMMParis(startRange);
        const endStr = formatTimeHHMMParis(endRange);
        const trackingUrl = `${baseUrl}/track?token=${recipient.public_token}`;

        const messageBody = `Bonjour ${recipient.label}, notre tournée de livraison (fromages et saucissons) a commencé.\n\n Passage prévu entre ${startStr} et ${endStr}. Suivez en direct : ${trackingUrl}.\n\n - Félix & Thomas`;

        const requestBody = new URLSearchParams({
          To: recipient.phone_number,
          From: twilioPhoneNumber,
          Body: messageBody,
        });

        const twilioRes = await fetch(twilioApiUrl, {
          method: "POST",
          headers: {
            Authorization: basicAuth,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: requestBody,
        });

        if (twilioRes.ok) {
          smsSentCount++;
        } else {
          const errData = await twilioRes.json();
          console.error("Twilio SMS failed for recipient", id, errData);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scheduledCount: scheduledAts.length,
        smsSentCount,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error in start-delivery-round:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

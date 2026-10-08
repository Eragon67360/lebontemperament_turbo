import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSuperadmin } from "../_shared/caller-auth.ts";
import { deliveryMessage } from "../_shared/delivery-messages.ts";
import { pushToRecipient } from "../_shared/delivery-push.ts";
import { requireServiceKey } from "../_shared/supabase-keys.ts";

const OSRM_ROUTE_BASE = "https://router.project-osrm.org/route/v1/driving";

interface RecipientRow {
  id: string;
  latitude: number;
  longitude: number;
  sort_order: number;
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

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      requireServiceKey(),
    );

    // Only the delivery driver (a superadmin) runs delivery rounds.
    const caller = await requireSuperadmin(req, supabaseAdmin);
    if (caller instanceof Response) return caller;

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

    const { data: recipients, error } = await supabaseAdmin
      .from("delivery_recipients")
      .select("id, latitude, longitude, sort_order, delivered_at")
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

    // « sendSms » now means: tell the recipients, by push to the phones
    // linked in the app (#593). The name stays for installed driver apps.
    let pushSentCount = 0;
    if (sendSms) {
      for (const { id, scheduledAt } of scheduledAts) {
        const recipient = withCoords.find((r) => r.id === id);
        if (recipient?.delivered_at != null) continue;
        const sent = await pushToRecipient(
          supabaseAdmin,
          id,
          deliveryMessage("started", id, new Date(scheduledAt)),
        );
        if (sent > 0) pushSentCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scheduledCount: scheduledAts.length,
        // Since #593 the start of the round is a push only; installed driver
        // apps still read this field.
        smsSentCount: 0,
        pushSentCount,
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

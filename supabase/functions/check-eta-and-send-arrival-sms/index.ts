import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/caller-auth.ts";
import { deliveryMessage } from "../_shared/delivery-messages.ts";
import { arrivalSms } from "../_shared/delivery-sms.ts";
import { sendSms } from "../_shared/twilio.ts";
import {
  linkedDeviceCounts,
  pushToRecipient,
} from "../_shared/delivery-push.ts";
import { requireServiceKey } from "../_shared/supabase-keys.ts";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
const ETA_THRESHOLD_SECONDS = 300; // 5 minutes

interface DeliveryRow {
  id: string;
  latitude: number;
  longitude: number;
  current_recipient_id: string;
}

interface RecipientRow {
  id: string;
  latitude: number | null;
  longitude: number | null;
  phone_number: string | null;
  label: string;
  code: string;
  eta_arrival_sms_sent_at: string | null;
}

async function fetchOSRMDuration(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number,
): Promise<number | null> {
  const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{ duration?: number }>;
    };
    const route = data.routes?.[0];
    if (data.code !== "Ok" || !route) return null;
    return typeof route.duration === "number" ? route.duration : null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Only the pg_cron job may trigger arrival SMS.
  const refused = requireInternalSecret(req);
  if (refused) return refused;

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      requireServiceKey(),
    );

    const { data: deliveries, error: deliveriesError } = await supabaseAdmin
      .from("deliveries")
      .select("id, latitude, longitude, current_recipient_id")
      .eq("is_tracking_active", true)
      .not("current_recipient_id", "is", null)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (deliveriesError) throw deliveriesError;
    if (!deliveries?.length) {
      return new Response(
        JSON.stringify({ message: "No active deliveries to check." }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const siteUrl = Deno.env.get("SITE_URL");

    let sentCount = 0;

    for (const d of deliveries as DeliveryRow[]) {
      const { data: recipient, error: recipientError } = await supabaseAdmin
        .from("delivery_recipients")
        .select(
          "id, latitude, longitude, phone_number, label, code, eta_arrival_sms_sent_at",
        )
        .eq("id", d.current_recipient_id)
        .single();

      if (recipientError || !recipient) continue;

      const r = recipient as RecipientRow;
      const hasPhone = !!r.phone_number?.trim();

      if (
        r.eta_arrival_sms_sent_at != null ||
        r.latitude == null ||
        r.longitude == null
      ) {
        continue;
      }
      // Nobody to tell: no phone number and no phone linked in the app.
      const linked =
        (await linkedDeviceCounts(supabaseAdmin, [r.id])).get(r.id) ?? 0;
      if (!hasPhone && linked === 0) continue;

      const durationSeconds = await fetchOSRMDuration(
        d.longitude,
        d.latitude,
        r.longitude,
        r.latitude,
      );

      if (durationSeconds == null || durationSeconds > ETA_THRESHOLD_SECONDS) {
        continue;
      }

      // #593: phones linked in the app get a push, and nothing else. The
      // SMS is the fallback for people who never opened the delivery in the
      // app (or whose linked phones no longer receive pushes).
      const pushed =
        linked > 0
          ? await pushToRecipient(
              supabaseAdmin,
              r.id,
              deliveryMessage("arriving", r.id),
            )
          : 0;

      let smsSent = false;
      if (pushed === 0 && hasPhone) {
        smsSent = await sendSms(
          r.phone_number!,
          arrivalSms({ label: r.label, code: r.code, siteUrl }),
        );
        if (smsSent) {
          sentCount++;
          console.log(`Sent 5-min-away SMS to recipient ${r.id}`);
        }
      }

      // Once told, never again; a failed SMS is retried on the next run.
      if (pushed > 0 || smsSent) {
        await supabaseAdmin
          .from("delivery_recipients")
          .update({ eta_arrival_sms_sent_at: new Date().toISOString() })
          .eq("id", r.id);
      }
    }

    return new Response(JSON.stringify({ success: true, sentCount }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in check-eta-and-send-arrival-sms:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

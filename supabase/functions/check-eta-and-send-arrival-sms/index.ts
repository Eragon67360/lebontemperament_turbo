import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  public_token: string;
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
  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
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

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;
    const siteUrl = Deno.env.get("SITE_URL")!;
    const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basicAuth = "Basic " + btoa(`${accountSid}:${authToken}`);

    let sentCount = 0;

    for (const d of deliveries as DeliveryRow[]) {
      const { data: recipient, error: recipientError } = await supabaseAdmin
        .from("delivery_recipients")
        .select(
          "id, latitude, longitude, phone_number, label, public_token, eta_arrival_sms_sent_at",
        )
        .eq("id", d.current_recipient_id)
        .single();

      if (recipientError || !recipient) continue;

      const r = recipient as RecipientRow;

      if (
        r.eta_arrival_sms_sent_at != null ||
        r.latitude == null ||
        r.longitude == null ||
        !r.phone_number?.trim()
      ) {
        continue;
      }

      const durationSeconds = await fetchOSRMDuration(
        d.longitude,
        d.latitude,
        r.longitude,
        r.latitude,
      );

      if (durationSeconds == null || durationSeconds > ETA_THRESHOLD_SECONDS) {
        continue;
      }

      const trackingUrl = `${siteUrl.replace(/\/$/, "")}/track?token=${r.public_token}`;
      const messageBody =
        `Bonjour ${r.label}, votre livraison arrive dans environ 5 minutes ! Préparez-vous à recevoir votre colis.\n\n` +
        `Suivez-la en direct : ${trackingUrl}\n\n` +
        "- Félix & Thomas";

      const requestBody = new URLSearchParams({
        To: r.phone_number,
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

      if (!twilioRes.ok) {
        const errorData = await twilioRes.json();
        console.error("Twilio API Error for recipient", r.id, errorData);
        continue;
      }

      await supabaseAdmin
        .from("delivery_recipients")
        .update({ eta_arrival_sms_sent_at: new Date().toISOString() })
        .eq("id", r.id);

      sentCount++;
      console.log(`Sent 5-min-away SMS to recipient ${r.id}`);
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

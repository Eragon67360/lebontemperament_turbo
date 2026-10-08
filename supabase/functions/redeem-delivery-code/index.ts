// A delivery recipient opens their delivery in the app (#593), without an
// account: the code from the SMS (or the link /l/<code>) is checked by
// redeem_delivery_code(), which caps failed attempts at 10 an hour per caller
// (an HMAC of the IP, never the IP). With the phone's push token, the phone
// is linked to that recipient for the delivery-day pushes.
//
// Called by the app with the public anon key:
//   { "code": "K7MP-4XQ9", "fcm_token"?: "...", "platform"?: "ios"|"android" }
//     → 200 {status:"ok", recipient_id, tracking_token, label}
//       404 {status:"not_found"} · 400 {status:"invalid"} · 429 {status:"rate_limited"}
//   { "action": "forget", "tracking_token": "...", "fcm_token": "..." }
//     → 200 {status:"ok"}: that phone stops receiving the delivery's pushes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { callerIp, clientKey, httpStatus } from "./client.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function text(value: unknown, max: number): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= max
    ? value
    : null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (body.action === "forget") {
      const trackingToken = text(body.tracking_token, 200);
      const fcmToken = text(body.fcm_token, 4096);
      if (!trackingToken || !fcmToken) {
        return jsonResponse({ status: "invalid" }, 400);
      }
      const { error } = await admin.rpc("forget_delivery_device", {
        p_tracking_token: trackingToken,
        p_fcm_token: fcmToken,
      });
      if (error) throw error;
      return jsonResponse({ status: "ok" });
    }

    const { data, error } = await admin.rpc("redeem_delivery_code", {
      p_code: text(body.code, 64) ?? "",
      p_client: await clientKey(callerIp(req.headers), serviceKey),
      p_fcm_token: text(body.fcm_token, 4096),
      p_platform: text(body.platform, 16),
    });
    if (error) throw error;
    const result = data as { status: string };
    return jsonResponse(result, httpStatus(result.status));
  } catch (err) {
    console.error(
      "redeem-delivery-code failed:",
      err instanceof Error ? err.message : err,
    );
    return jsonResponse({ error: "Internal error" }, 500);
  }
});

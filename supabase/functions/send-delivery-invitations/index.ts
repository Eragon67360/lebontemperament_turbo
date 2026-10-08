// The invitation SMS of a delivery (#593): one per recipient, sent by the
// driver ahead of delivery day, with the date, the link /l/<code> and the
// code. It is the only SMS a recipient gets before the « 5 minutes » one
// (check-eta-and-send-arrival-sms), and only for people without the app.
//
// Called by the driver (a superadmin) from the app:
//   { "deliveryId": "...", "recipientIds"?: ["..."] }
//   Without recipientIds: everyone with a phone, not delivered, not invited.
//   With recipientIds: those recipients of that delivery, even if invited
//   already (« Renvoyer l'invitation »).
//   → 200 { sentCount, failedCount, skippedNoPhone }
//     400 { error: "no_date" } until the delivery has a date (scheduled_at).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSuperadmin } from "../_shared/caller-auth.ts";
import { invitationSms } from "../_shared/delivery-sms.ts";
import { sendSms } from "../_shared/twilio.ts";
import { requireServiceKey } from "../_shared/supabase-keys.ts";

interface RecipientRow {
  id: string;
  label: string;
  phone_number: string | null;
  code: string;
  invited_at: string | null;
  delivered_at: string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      requireServiceKey(),
    );

    // Only the delivery driver (a superadmin) runs delivery rounds.
    const caller = await requireSuperadmin(req, supabaseAdmin);
    if (caller instanceof Response) return caller;

    const body = (await req.json().catch(() => ({}))) as {
      deliveryId?: unknown;
      recipientIds?: unknown;
    };
    const deliveryId =
      typeof body.deliveryId === "string" ? body.deliveryId : null;
    const recipientIds = Array.isArray(body.recipientIds)
      ? body.recipientIds.filter((id): id is string => typeof id === "string")
      : null;
    if (!deliveryId) return jsonResponse({ error: "Missing deliveryId" }, 400);

    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from("deliveries")
      .select("id, scheduled_at")
      .eq("id", deliveryId)
      .maybeSingle();
    if (deliveryError) throw deliveryError;
    if (!delivery) return jsonResponse({ error: "not_found" }, 404);
    if (!delivery.scheduled_at) return jsonResponse({ error: "no_date" }, 400);

    let query = supabaseAdmin
      .from("delivery_recipients")
      .select("id, label, phone_number, code, invited_at, delivered_at")
      .eq("delivery_id", deliveryId)
      .is("delivered_at", null);
    query = recipientIds
      ? query.in("id", recipientIds)
      : query.is("invited_at", null);
    const { data: rows, error } = await query;
    if (error) throw error;

    const siteUrl = Deno.env.get("SITE_URL");
    const deliveryDay = new Date(delivery.scheduled_at);
    let sentCount = 0;
    let failedCount = 0;
    let skippedNoPhone = 0;

    for (const r of (rows ?? []) as RecipientRow[]) {
      const phone = r.phone_number?.trim();
      if (!phone) {
        skippedNoPhone++;
        continue;
      }

      // Claim first, so a second tap can't send the same invitation twice.
      const claimedAt = new Date().toISOString();
      let claim = supabaseAdmin
        .from("delivery_recipients")
        .update({ invited_at: claimedAt })
        .eq("id", r.id);
      claim = r.invited_at
        ? claim.eq("invited_at", r.invited_at)
        : claim.is("invited_at", null);
      const { data: claimed } = await claim.select("id");
      if (!claimed?.length) continue;

      const sent = await sendSms(
        phone,
        invitationSms({ label: r.label, deliveryDay, code: r.code, siteUrl }),
      );
      if (sent) {
        sentCount++;
      } else {
        failedCount++;
        await supabaseAdmin
          .from("delivery_recipients")
          .update({ invited_at: r.invited_at })
          .eq("id", r.id);
      }
    }

    return jsonResponse({ sentCount, failedCount, skippedNoPhone });
  } catch (err) {
    console.error(
      "Error in send-delivery-invitations:",
      err instanceof Error ? err.message : err,
    );
    return jsonResponse({ error: "Internal error" }, 500);
  }
});

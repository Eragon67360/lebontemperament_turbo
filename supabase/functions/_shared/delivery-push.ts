// Pushes to the phones a delivery recipient linked in the app (#593,
// delivery_devices). A recipient without a linked phone simply gets nothing
// here; the SMS stay as they were.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getAccessToken,
  readServiceAccount,
  type ServiceAccount,
  sendToToken,
  type TokenMessage,
} from "./fcm.ts";

let credentials: Promise<{ sa: ServiceAccount; token: string }> | null = null;

function fcmCredentials() {
  credentials ??= (async () => {
    const sa = readServiceAccount();
    return { sa, token: await getAccessToken(sa) };
  })();
  // A failed attempt (missing secret, Google down) is retried next call.
  credentials.catch(() => (credentials = null));
  return credentials;
}

/** Number of phones linked to these recipients, by recipient id. */
export async function linkedDeviceCounts(
  admin: SupabaseClient,
  recipientIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (recipientIds.length === 0) return counts;
  const { data, error } = await admin
    .from("delivery_devices")
    .select("recipient_id")
    .in("recipient_id", recipientIds);
  if (error) {
    console.error("delivery_devices read failed:", error.message);
    return counts;
  }
  for (const row of data ?? []) {
    const id = row.recipient_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/**
 * Sends the message to every phone linked to the recipient and drops the
 * phones FCM no longer knows. Returns how many phones got it; never throws.
 */
export async function pushToRecipient(
  admin: SupabaseClient,
  recipientId: string,
  msg: TokenMessage,
): Promise<number> {
  try {
    const { data: devices, error } = await admin
      .from("delivery_devices")
      .select("id, fcm_token")
      .eq("recipient_id", recipientId);
    if (error) throw error;
    if (!devices?.length) return 0;

    const { sa, token } = await fcmCredentials();
    let sent = 0;
    for (const device of devices) {
      const result = await sendToToken(sa, token, device.fcm_token, msg);
      if (result === "sent") sent++;
      if (result === "unregistered") {
        await admin.from("delivery_devices").delete().eq("id", device.id);
      }
    }
    return sent;
  } catch (err) {
    console.error(
      "Delivery push failed for recipient",
      recipientId,
      err instanceof Error ? err.message : err,
    );
    return 0;
  }
}

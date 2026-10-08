import { isValidDeliveryCode, normalizeDeliveryCode } from "@/lib/deliveryCode";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { createHmac } from "node:crypto";

import { TrackByTokenContent } from "../../track/TrackByToken";
import { AppInviteCard } from "./AppInviteCard";
import { CodeStatusPage, type CodeStatus } from "./CodeStatusPage";

// Delivery links are personal: never indexed, never cached.
export const metadata: Metadata = {
  title: "Suivi de livraison",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** What `redeem_delivery_code` answers (see the migration for #593). */
type RedeemResult =
  | {
      status: "ok";
      recipient_id: string;
      tracking_token: string;
      label: string;
    }
  | { status: "not_found" | "rate_limited" | "invalid" };

/**
 * The rate-limit key the database counts failed attempts under: an HMAC of
 * the visitor's address keyed with the service-role key, so the stored value
 * cannot be turned back into the address. The app's edge function computes
 * the same value and shares the counter. The address itself is never logged
 * or stored.
 */
function rateLimitKey(forwardedFor: string | null, realIp: string | null) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "unknown";
  return createHmac("sha256", secret).update(ip).digest("hex");
}

/**
 * `/l/<code>` (#593): the link printed in the delivery SMS. The code (with or
 * without its dash, any case) is exchanged server side for the recipient's
 * tracking token, and the page then shows the same tracking view as
 * `/track?token=…`, with an invitation to follow the delivery in the app.
 * The exchange runs with the admin client because the function is reserved
 * to the service role; the browser never sees a key.
 */
export default async function DeliveryCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = normalizeDeliveryCode(rawCode);

  // Junk that can match nothing (crawlers, typos in the URL) is answered
  // without a database call; the function would count it as a failed attempt.
  if (!isValidDeliveryCode(code)) {
    return <CodeStatusPage status="not_found" />;
  }

  const requestHeaders = await headers();
  const client = rateLimitKey(
    requestHeaders.get("x-forwarded-for"),
    requestHeaders.get("x-real-ip"),
  );
  if (!client) {
    console.error("[l/code] SUPABASE_SERVICE_ROLE_KEY is not set");
    return <CodeStatusPage status="error" />;
  }

  const { data, error } = await createAdminClient().rpc(
    "redeem_delivery_code",
    { p_code: code, p_client: client },
  );
  if (error) {
    console.error("[l/code] redeem_delivery_code failed:", error.message);
    return <CodeStatusPage status="error" />;
  }

  const result = data as RedeemResult | null;
  if (!result) {
    console.error("[l/code] redeem_delivery_code returned nothing");
    return <CodeStatusPage status="error" />;
  }
  if (result.status !== "ok") {
    // `invalid` cannot happen after the check above; treat it as not found.
    const status: CodeStatus =
      result.status === "rate_limited" ? "rate_limited" : "not_found";
    return <CodeStatusPage status={status} />;
  }

  return (
    <TrackByTokenContent
      key={result.tracking_token}
      token={result.tracking_token}
      banner={<AppInviteCard code={code} />}
    />
  );
}

// Pure helpers of redeem-delivery-code, covered by client_test.ts.

/** The caller's IP as the Supabase gateway forwards it. */
export function callerIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Rate-limit key: HMAC-SHA256 (hex) of the IP with the service-role key, so
 * the IP itself is never stored and can't be recovered by hashing every
 * address. The website's /l/<code> page computes the same key.
 */
export async function clientKey(ip: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(ip),
  );
  return Array.from(new Uint8Array(mac), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export type RedeemStatus = "ok" | "not_found" | "invalid" | "rate_limited";

export function httpStatus(status: string): number {
  switch (status) {
    case "ok":
      return 200;
    case "not_found":
      return 404;
    case "rate_limited":
      return 429;
    case "invalid":
      return 400;
    default:
      return 500;
  }
}

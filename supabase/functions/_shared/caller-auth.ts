// Caller checks shared by the edge functions.
//
// Every function runs with the service-role key, so it must decide for itself
// who may call it: the public anon key is a valid JWT for the gateway.
//
// - Functions invoked by pg_cron or database triggers send `x-internal-secret`,
//   read from Vault (`internal_function_secret`) and compared with the
//   function secret `INTERNAL_FUNCTION_SECRET`.
// - Functions invoked by the driver from the app send the member's session;
//   only superadmins run delivery rounds (same rule as the delivery tables' RLS).
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

function deny(status: number, error: string, headers: HeadersInit) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

/** Compares two strings in constant time for equal lengths. */
export function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/**
 * Requires the internal secret sent by pg_cron jobs and database triggers.
 * Returns the refusal to send back, or null when the caller is allowed.
 * Fails closed when the function secret isn't configured.
 */
export function requireInternalSecret(
  req: Request,
  headers: HeadersInit = {},
): Response | null {
  const expected = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (!expected) {
    console.error("INTERNAL_FUNCTION_SECRET is not set");
    return deny(500, "Server misconfigured", headers);
  }
  const received = req.headers.get("x-internal-secret") ?? "";
  return safeEqual(received, expected)
    ? null
    : deny(401, "Unauthorized", headers);
}

/**
 * Requires a signed-in superadmin (the delivery driver).
 * Returns the refusal to send back, or the caller's user id.
 */
export async function requireSuperadmin(
  req: Request,
  supabaseAdmin: SupabaseClient,
  headers: HeadersInit = {},
): Promise<Response | { userId: string }> {
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!token) return deny(401, "Unauthorized", headers);

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return deny(401, "Unauthorized", headers);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  if (profile?.role !== "superadmin") return deny(403, "Forbidden", headers);

  return { userId: data.user.id };
}

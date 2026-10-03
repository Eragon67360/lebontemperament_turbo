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
// - sync-drive-index accepts either the internal secret (cron) or a signed-in
//   admin's session (the admin's /api/drive-sync forwards it), so the admin
//   app never holds the internal secret.
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
 * Resolves the bearer token to a signed-in user and their profile role, by
 * asking Supabase Auth (never by decoding the JWT locally).
 * Returns the refusal to send back, or the user id and role.
 */
async function requireSignedInRole(
  req: Request,
  supabaseAdmin: SupabaseClient,
  headers: HeadersInit,
): Promise<Response | { userId: string; role: string | null }> {
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

  return { userId: data.user.id, role: profile?.role ?? null };
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
  const caller = await requireSignedInRole(req, supabaseAdmin, headers);
  if (caller instanceof Response) return caller;
  if (caller.role !== "superadmin") return deny(403, "Forbidden", headers);
  return { userId: caller.userId };
}

export type InternalOrAdminCaller =
  { kind: "internal" } | { kind: "admin"; userId: string };

/**
 * Accepts either the internal secret (pg_cron) or a signed-in admin or
 * superadmin (the admin app forwarding the user's session).
 * When `x-internal-secret` is sent it must match: a wrong secret is refused
 * even with a valid admin session, so a leaked wrong value can't fall back.
 * Returns the refusal to send back, or who the caller is.
 */
export async function requireInternalSecretOrAdmin(
  req: Request,
  supabaseAdmin: SupabaseClient,
  headers: HeadersInit = {},
): Promise<Response | InternalOrAdminCaller> {
  if (req.headers.has("x-internal-secret")) {
    const refused = requireInternalSecret(req, headers);
    return refused ?? { kind: "internal" };
  }

  const caller = await requireSignedInRole(req, supabaseAdmin, headers);
  if (caller instanceof Response) return caller;
  if (caller.role !== "admin" && caller.role !== "superadmin") {
    return deny(403, "Forbidden", headers);
  }
  return { kind: "admin", userId: caller.userId };
}

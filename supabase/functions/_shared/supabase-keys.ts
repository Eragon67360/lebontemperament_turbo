// The key the functions' admin clients use (#570).
//
// The platform gives every function both key systems: the legacy
// `SUPABASE_SERVICE_ROLE_KEY` (a JWT) and `SUPABASE_SECRET_KEYS`, a JSON object
// of the project's secret keys (`sb_secret_…`) by name. The `default` secret
// key wins when it exists, so the functions keep working once the legacy keys
// are disabled; until the project has secret keys, the legacy key is used.
//
// The website's `SUPABASE_SERVICE_ROLE_KEY` (Vercel) must hold the same key:
// redeem-delivery-code and the website's /l/<code> page both key their shared
// rate-limit counter with it.

function defaultSecretKey(): string | undefined {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) return undefined;
  try {
    const keys = JSON.parse(raw) as Record<string, unknown>;
    const key = keys?.default;
    return typeof key === "string" && key.length > 0 ? key : undefined;
  } catch {
    console.error("SUPABASE_SECRET_KEYS is not valid JSON");
    return undefined;
  }
}

/** The default secret key, else the legacy service-role key, else undefined. */
export function findServiceKey(): string | undefined {
  return (
    defaultSecretKey() ??
    (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || undefined)
  );
}

/** Like findServiceKey, but throws when the function has no key at all. */
export function requireServiceKey(): string {
  const key = findServiceKey();
  if (!key) {
    throw new Error(
      "Missing environment variable: SUPABASE_SECRET_KEYS or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return key;
}

import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type BrowserClient = SupabaseClient<Database>;

/**
 * Whether this browser holds a Supabase session cookie
 * (`sb-<project>-auth-token`, possibly chunked `.0`, `.1`…), which
 * `@supabase/ssr` writes on sign-in and the proxy refreshes on every request.
 * A cheap check that lets public pages skip supabase-js (about 50 KB of
 * brotli) for the visitors who have no session: everyone but members.
 */
export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)sb-[^=;]*-auth-token(?:\.\d+)?=/.test(document.cookie);
}

let client: Promise<BrowserClient> | null = null;

/**
 * The browser client, loaded on first use. `createBrowserClient` is itself a
 * singleton per page, so every caller shares one session and one Realtime
 * connection, as before.
 */
export function loadBrowserClient(): Promise<BrowserClient> {
  if (!client) {
    client = import("./client").then((mod) => mod.createClient());
  }
  return client;
}

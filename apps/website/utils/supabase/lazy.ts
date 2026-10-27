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

/**
 * Memoises an async load: every caller shares the one pending promise, and a
 * load that fails is forgotten, so the next call tries again instead of
 * getting the same rejection for the rest of the page's life.
 */
export function memoizeLoader<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    if (!pending) {
      pending = load().catch((error: unknown) => {
        // No other attempt can have started while this one was pending.
        pending = null;
        throw error;
      });
    }
    return pending;
  };
}

/**
 * The browser client, loaded on first use. `createBrowserClient` is itself a
 * singleton per page, so every caller shares one session and one Realtime
 * connection, as before. A failed load (a chunk missing after a deployment, a
 * flaky network) is retried by the next caller.
 */
export const loadBrowserClient: () => Promise<BrowserClient> = memoizeLoader(
  () => import("./client").then((mod) => mod.createClient()),
);

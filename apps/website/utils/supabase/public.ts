import type { Database } from "@repo/domain/database.types";
import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less Supabase client for public data (anon key, row-level security
 * applies exactly as for an anonymous visitor). Unlike `server.ts` it never
 * touches `cookies()`, so pages reading through it can be prerendered and
 * served from the cache with `export const revalidate`.
 *
 * Never use it for anything that depends on who is signed in.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

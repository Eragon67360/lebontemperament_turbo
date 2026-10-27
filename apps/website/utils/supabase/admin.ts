import "server-only";

import type { Database } from "@repo/domain/database.types";
import { createClient } from "@supabase/supabase-js";

/**
 * The service-role client, which bypasses RLS. `server-only` makes a build
 * fail if a client component imports it. It authenticates with the key
 * alone, so it keeps no session: nothing is stored, refreshed or read from
 * the URL.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}

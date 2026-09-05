import type { Database } from "@repo/domain/database.types";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    },
  );
}

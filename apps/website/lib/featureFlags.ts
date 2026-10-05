import { CACHE_TAGS } from "@/lib/cacheTags";
import {
  ANNIVERSARY_FLAG_KEY,
  type PublicFeatureFlags,
} from "@/lib/featureFlagKeys";
import { createPublicClient } from "@/utils/supabase/public";
import { unstable_cache } from "next/cache";

// Server-only reader (see featureFlagKeys.ts for what client code may import).
export { ANNIVERSARY_FLAG_KEY, type PublicFeatureFlags };

const DEFAULT_FLAGS: PublicFeatureFlags = { anniversary: false };

/**
 * Reads the public feature flags once (cookie-less client, anon key) and
 * keeps them in the data cache for five minutes, or until the admin's toggle
 * calls `POST /api/revalidate` with the `feature-flags` tag. Any error counts
 * as "disabled", like the former per-visitor `/api/feature-flags` fetch.
 */
export const getPublicFeatureFlags = unstable_cache(
  async (): Promise<PublicFeatureFlags> => {
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("feature_flags")
        .select("flag_key, is_enabled")
        .eq("flag_key", ANNIVERSARY_FLAG_KEY);

      if (error) {
        console.error("Error fetching feature flags:", error);
        return DEFAULT_FLAGS;
      }

      const anniversary =
        data?.find((row) => row.flag_key === ANNIVERSARY_FLAG_KEY)
          ?.is_enabled === true;
      return { anniversary };
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      return DEFAULT_FLAGS;
    }
  },
  ["public-feature-flags"],
  { tags: [CACHE_TAGS.featureFlags], revalidate: 300 },
);

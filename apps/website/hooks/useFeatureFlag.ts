"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useFeatureFlags } from "@/components/providers/FeatureFlagProvider";
import type { PublicFeatureFlags } from "@/lib/featureFlagKeys";

/**
 * Reads a feature flag from the value rendered on the server
 * (`FeatureFlagProvider`). Synchronous: nothing to fetch and no Realtime
 * subscription per component any more; `isLoading` and `error` stay for
 * the callers written against the former fetching hook.
 */
export function useFeatureFlag(flag: keyof PublicFeatureFlags) {
  const flags = useFeatureFlags();
  return { isEnabled: flags[flag], isLoading: false, error: null };
}

/** The 40 years anniversary feature (`anniversary_40_years`). */
export function useAnniversaryFeature() {
  return useFeatureFlag("anniversary");
}

/**
 * Whether the signed-in user is an admin or superadmin, from the auth
 * provider (one profile read per session, nothing for anonymous visitors).
 */
export function useAdminStatus() {
  const { isAdmin, isLoading } = useAuth();
  return { isAdmin, isLoading };
}

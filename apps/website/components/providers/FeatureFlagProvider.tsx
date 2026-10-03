"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import {
  ANNIVERSARY_FLAG_KEY,
  type PublicFeatureFlags,
} from "@/lib/featureFlagKeys";
import { loadBrowserClient } from "@/utils/supabase/lazy";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const DEFAULT_FLAGS: PublicFeatureFlags = { anniversary: false };

const FeatureFlagContext = createContext<PublicFeatureFlags>(DEFAULT_FLAGS);

/**
 * Hands the feature flags read on the server (`lib/featureFlags.ts`, cached
 * and revalidated by the admin's toggle) to client components. Visitors get
 * the rendered value and nothing else: no fetch, no websocket. Signed-in
 * admins keep a Realtime subscription so a toggle shows without a reload
 * while they preview the site.
 */
export function FeatureFlagProvider({
  flags,
  children,
}: {
  flags: PublicFeatureFlags;
  children: ReactNode;
}) {
  const { isAdmin } = useAuth();
  // Realtime updates seen by an admin, layered over the server value (which
  // a navigation may refresh on its own).
  const [adminOverrides, setAdminOverrides] = useState<
    Partial<PublicFeatureFlags>
  >({});

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    loadBrowserClient().then((supabase) => {
      if (cancelled) return;
      const channel = supabase
        .channel(`feature-flags-admin-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "feature_flags",
            filter: `flag_key=eq.${ANNIVERSARY_FLAG_KEY}`,
          },
          (payload) => {
            const row = payload.new as { is_enabled?: boolean } | null;
            if (row && typeof row.is_enabled === "boolean") {
              setAdminOverrides((current) => ({
                ...current,
                anniversary: row.is_enabled === true,
              }));
            }
          },
        )
        .subscribe((status, err) => {
          if (err) console.error("[FeatureFlag] Subscription error:", err);
          else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
            console.error(`[FeatureFlag] Realtime ${status}`);
        });
      cleanup = () => {
        supabase.removeChannel(channel);
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [isAdmin]);

  const value = useMemo(
    () => ({ ...flags, ...adminOverrides }),
    [flags, adminOverrides],
  );

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags(): PublicFeatureFlags {
  return useContext(FeatureFlagContext);
}

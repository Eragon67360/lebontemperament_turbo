"use client";

import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

type FeatureFlag = {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Hook to check if a feature flag is enabled with real-time updates
 * @param flagKey - The unique key of the feature flag
 * @returns Object containing the enabled state and loading state
 */
export function useFeatureFlag(flagKey: string) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    // Fetch initial state from API
    const fetchFeatureFlag = async () => {
      try {
        const response = await fetch(`/api/feature-flags?flag_key=${flagKey}`);

        if (!response.ok) {
          console.error("Error fetching feature flag");
          setIsEnabled(false);
        } else {
          const data = await response.json();
          setIsEnabled(data?.is_enabled || false);
        }
      } catch (error) {
        console.error("Error fetching feature flag:", error);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatureFlag();

    // Subscribe to real-time updates
    const setupSubscription = async () => {
      try {
        const channelName = `feature-flag-${flagKey}-${Date.now()}`;

        channelRef.current = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "feature_flags",
              filter: `flag_key=eq.${flagKey}`,
            },
            (payload) => {
              const newFlag = payload.new as FeatureFlag;
              if (isMounted && newFlag) {
                console.log(
                  `[FeatureFlag] 🔄 ${flagKey}: ${isEnabled} → ${newFlag.is_enabled}`,
                );
                setIsEnabled(newFlag.is_enabled);
              }
            },
          )
          .subscribe((status, err) => {
            if (err) {
              console.error(`[FeatureFlag] Subscription error:`, err);
            }

            if (status === "SUBSCRIBED") {
              if (isMounted) {
                setError(null);
              }
            } else if (status === "CHANNEL_ERROR") {
              console.error(`[FeatureFlag] Channel error for ${flagKey}`);
              if (isMounted) {
                setError("Realtime subscription failed");
              }
            } else if (status === "TIMED_OUT") {
              if (isMounted) {
                setError("Realtime subscription timed out");
              }
            }
          });
      } catch (error) {
        console.error("[FeatureFlag] Failed to setup subscription:", error);
        if (isMounted) {
          setError("Failed to setup realtime subscription");
        }
      }
    };

    setupSubscription();

    // Cleanup
    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [flagKey, supabase]);

  return { isEnabled, isLoading, error };
}

/**
 * Hook specifically for the 40 years anniversary feature
 * @returns Object containing the enabled state and loading state
 */
export function useAnniversaryFeature() {
  return useFeatureFlag("anniversary_40_years");
}

/**
 * Hook to check if the current authenticated user is an admin
 * @returns Object containing the admin status and loading state
 */
export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAdminStatus = async () => {
      try {
        const response = await fetch("/api/auth/check-admin");

        if (!response.ok) {
          console.error("Error fetching admin status");
          setIsAdmin(false);
        } else {
          const data = await response.json();
          setIsAdmin(data?.isAdmin || false);
        }
      } catch (error) {
        console.error("Error fetching admin status:", error);
        setIsAdmin(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAdminStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isAdmin, isLoading };
}

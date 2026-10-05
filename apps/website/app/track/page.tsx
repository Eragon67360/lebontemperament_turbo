"use client";

import { createClient } from "@/utils/supabase/client";
import { AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import type { Delivery, DeliveryRecipient } from "./shared";
import {
  DeliveredPanel,
  PendingPanel,
  RecipientSinglePanel,
  StatusPanel,
  StoppedOverlay,
  TrackPageError,
  TrackPageLoadingFallback,
  TrackPrivacyNotice,
} from "./shared";

// Dynamically import the map component to prevent SSR and reduce initial bundle size
const TrackMapClient = dynamic(
  () => import("./TrackMapClient").then((mod) => mod.TrackMapClient),
  { ssr: false },
);

/**
 * Checks if a delivery's tracking link has expired.
 * @param expiresAt ISO string of the expiration date.
 * @returns True if the link has expired.
 */
function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/** How often the page refreshes the driver's position while a round is live. */
const POLL_INTERVAL_MS = 10_000;

type TrackingState =
  | { kind: "ok"; delivery: Delivery; recipient: DeliveryRecipient }
  | { kind: "invalid" | "not-found" | "expired" | "error" };

const TRACKING_ERRORS: Record<Exclude<TrackingState["kind"], "ok">, string> = {
  invalid: "URL invalide ou informations manquantes.",
  "not-found": "Livraison introuvable, expirée ou lien invalide.",
  expired: "Ce lien de suivi a expiré.",
  error: "Une erreur est survenue lors du chargement des données.",
};

/**
 * Core component for handling the tracking logic based on a URL token.
 * Remounted by its parent when the token changes, which resets its state.
 */
function TrackByTokenContent({ token }: { token: string | null }) {
  // State management
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [recipient, setRecipient] = useState<DeliveryRecipient | null>(null);
  const [etaForCurrentRecipient, setEtaForCurrentRecipient] =
    useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize Supabase client to prevent re-creation on re-renders
  const supabase = useMemo(() => createClient(), []);

  // Callback for when the map component calculates a new route ETA
  const handleRouteFetched = useCallback((durationSeconds: number | null) => {
    if (durationSeconds === null) {
      setEtaForCurrentRecipient(null);
      return;
    }
    setEtaForCurrentRecipient(new Date(Date.now() + durationSeconds * 1000));
  }, []);

  // Fetch the round through the token-checked function: it returns only what
  // this page shows, for this recipient's own link, while the round is live.
  const fetchTracking = useCallback(async (): Promise<TrackingState> => {
    if (!token) return { kind: "invalid" };
    const { data, error: rpcError } = await supabase.rpc(
      "get_tracking_by_recipient_token",
      { token },
    );
    if (rpcError) return { kind: "error" };
    if (!data) return { kind: "not-found" };
    const tracking = data as unknown as {
      delivery: Delivery;
      recipient: DeliveryRecipient;
    };
    if (isExpired(tracking.delivery.expires_at)) return { kind: "expired" };
    return { kind: "ok", ...tracking };
  }, [token, supabase]);

  // Initial load (the initial state already says "loading, no error")
  useEffect(() => {
    // The initial state is already "loading, no error"; the token never
    // changes during the page's life.
    let cancelled = false;
    fetchTracking()
      .then((state) => {
        if (cancelled) return;
        if (state.kind === "ok") {
          setDelivery(state.delivery);
          setRecipient(state.recipient);
        } else {
          setError(TRACKING_ERRORS[state.kind]);
        }
      })
      .catch((err) => {
        console.error("Error resolving token:", err);
        if (!cancelled) setError(TRACKING_ERRORS.error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchTracking]);

  // Live updates: poll while the page is visible (the tables aren't readable
  // by visitors, so realtime subscriptions can't be used here).
  const isLive = !!delivery && !!recipient && !recipient.delivered_at && !error;
  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const state = await fetchTracking();
        if (cancelled) return;
        if (state.kind === "ok") {
          setDelivery(state.delivery);
          setRecipient(state.recipient);
        } else if (state.kind !== "error") {
          setError(TRACKING_ERRORS[state.kind]);
        }
      } catch {
        // Transient network error: keep the last known state, retry next tick.
      }
    };
    const interval = window.setInterval(refresh, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isLive, fetchTracking]);

  // Auto-refresh when connection is restored (e.g. after CHANNEL_ERROR)
  useEffect(() => {
    if (!error) return;
    const handleOnline = () => window.location.reload();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [error]);

  // --- Render Logic ---

  if (isLoading) {
    return <TrackPageLoadingFallback />;
  }

  if (error) {
    return (
      <TrackPageError
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!delivery || !recipient) {
    return null; // Should not happen if not loading and no error
  }

  // --- Derived State for Rendering ---
  const isDelivered = !!recipient.delivered_at;
  const isInProgress = delivery.current_recipient_id === recipient.id;
  const hasPosition = delivery.latitude !== null && delivery.longitude !== null;

  // MapLibre/GeoJSON expect [longitude, latitude]
  const driverPosition: [number, number] = hasPosition
    ? [delivery.longitude!, delivery.latitude!]
    : [2.3522, 48.8566]; // Default to Paris if no position

  const destination: [number, number] | undefined =
    recipient.latitude != null && recipient.longitude != null
      ? [recipient.longitude, recipient.latitude]
      : undefined;

  // --- Render Views ---

  if (isDelivered) {
    return (
      <div className="flex h-dvh min-h-dvh w-full items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
        <div className="flex w-full max-w-lg flex-col items-center gap-3">
          <DeliveredPanel
            deliveredAt={recipient.delivered_at!}
            label={recipient.label}
          />
          <TrackPrivacyNotice />
        </div>
      </div>
    );
  }

  // View for "En route" status
  if (isInProgress) {
    return (
      <div className="relative z-0 h-full min-h-dvh w-full bg-gray-200 dark:bg-gray-800">
        <TrackMapClient
          center={driverPosition}
          delivery={delivery}
          hasPosition={hasPosition}
          destination={destination}
          onRouteFetched={handleRouteFetched}
        />
        <AnimatePresence>
          {!delivery.is_tracking_active && (
            <StoppedOverlay delivery={delivery} />
          )}
        </AnimatePresence>
        {delivery.is_tracking_active && (
          <div className="absolute top-0 right-0 left-0 z-10 p-3 sm:p-4">
            <div className="mx-auto flex max-w-lg flex-col gap-3">
              <RecipientSinglePanel
                recipient={recipient}
                delivery={delivery}
                etaForCurrentRecipient={etaForCurrentRecipient}
                status="live"
              />
              {(delivery.is_delayed || delivery.problem_message) && (
                <StatusPanel delivery={delivery} />
              )}
              <div className="rounded-xl bg-white/90 p-2 shadow dark:bg-gray-900/90">
                <TrackPrivacyNotice />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default view for "Pending" status (not yet en route)
  return (
    <PendingPanel>
      <RecipientSinglePanel
        recipient={recipient}
        delivery={delivery}
        etaForCurrentRecipient={null} // No real-time ETA when pending
        status="pending"
      />
      {(delivery.is_delayed || delivery.problem_message) && (
        <StatusPanel delivery={delivery} />
      )}
    </PendingPanel>
  );
}

/**
 * Page wrapper component that provides a Suspense boundary.
 */
export default function TrackByTokenPage() {
  return (
    <Suspense fallback={<TrackPageLoadingFallback />}>
      <TrackByToken />
    </Suspense>
  );
}

/** Reads the token from the URL; a new token starts a fresh tracking view. */
function TrackByToken() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  return <TrackByTokenContent key={token ?? ""} token={token} />;
}

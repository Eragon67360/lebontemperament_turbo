"use client";

import { createClient } from "@/utils/supabase/client";
import { AnimatePresence } from "framer-motion";
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

/**
 * Core component for handling the tracking logic based on a URL token.
 */
function TrackByTokenContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

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

  // Effect to fetch initial data based on the token from the URL
  useEffect(() => {
    async function resolveToken() {
      setIsLoading(true);
      setError(null);

      if (!token) {
        setError("URL invalide ou informations manquantes.");
        setIsLoading(false);
        return;
      }

      try {
        // 1. Find the recipient by their unique public token
        const { data: recipientData, error: recipientError } = await supabase
          .from("delivery_recipients")
          .select("*")
          .eq("public_token", token)
          .single();

        if (recipientError || !recipientData) {
          setError("Livraison introuvable, expirée ou lien invalide.");
          setIsLoading(false);
          return;
        }

        // 2. Fetch the associated delivery
        const { data: deliveryData, error: deliveryError } = await supabase
          .from("deliveries")
          .select("*")
          .eq("id", recipientData.delivery_id)
          .single();

        if (deliveryError || !deliveryData) {
          setError("Livraison introuvable ou expirée.");
          setIsLoading(false);
          return;
        }

        // 3. Check if the tracking link has expired
        if (isExpired(deliveryData.expires_at)) {
          setError("Ce lien de suivi a expiré.");
          setIsLoading(false);
          return;
        }

        // 4. Set state with the fetched data
        setRecipient(recipientData as DeliveryRecipient);
        setDelivery(deliveryData as Delivery);
      } catch (err) {
        console.error("Error resolving token:", err);
        setError("Une erreur est survenue lors du chargement des données.");
      } finally {
        setIsLoading(false);
      }
    }

    resolveToken();
  }, [token, supabase]);

  // Effect to subscribe to real-time updates from Supabase
  useEffect(() => {
    if (!delivery || !recipient) return;

    const channel = supabase.channel(`delivery-tracking:${delivery.id}`);

    // Listen for updates to the main delivery record
    channel
      .on<Delivery>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deliveries",
          filter: `id=eq.${delivery.id}`,
        },
        (payload) => setDelivery(payload.new),
      )
      // Listen for updates to this specific recipient
      .on<DeliveryRecipient>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_recipients",
          filter: `id=eq.${recipient.id}`,
        },
        (payload) => setRecipient(payload.new),
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setError(
            "La connexion au suivi en direct a été perdue. Veuillez réactualiser la page.",
          );
        }
      });

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [delivery, recipient, supabase]);

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
        <DeliveredPanel
          deliveredAt={recipient.delivered_at!}
          label={recipient.label}
        />
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
              <StatusPanel delivery={delivery} status="live" />
              <RecipientSinglePanel
                recipient={recipient}
                delivery={delivery}
                etaForCurrentRecipient={etaForCurrentRecipient}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default view for "Pending" status (not yet en route)
  return (
    <PendingPanel>
      <StatusPanel delivery={delivery} status="pending" />
      <RecipientSinglePanel
        recipient={recipient}
        delivery={delivery}
        etaForCurrentRecipient={null} // No real-time ETA when pending
      />
    </PendingPanel>
  );
}

/**
 * Page wrapper component that provides a Suspense boundary.
 */
export default function TrackByTokenPage() {
  return (
    <Suspense fallback={<TrackPageLoadingFallback />}>
      <TrackByTokenContent />
    </Suspense>
  );
}

"use client";

import { createClient } from "@/utils/supabase/client";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import type { Delivery, DeliveryRecipient } from "../shared";
import {
  RecipientsPanel,
  StatusPanel,
  StoppedOverlay,
  TrackPageError,
  TrackPageLoadingFallback,
} from "../shared";

const TrackMapClient = dynamic(
  () => import("./TrackMapClient").then((mod) => mod.TrackMapClient),
  { ssr: false },
);

// --- Main Content Component ---
function DeliveryTrackingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const deliveryId = params.deliveryId as string;
  const token = searchParams.get("token");

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [recipients, setRecipients] = useState<DeliveryRecipient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const loadRecipients = useCallback(async () => {
    const { data } = await supabase
      .from("delivery_recipients")
      .select("*")
      .eq("delivery_id", deliveryId)
      .order("sort_order")
      .order("scheduled_at");
    if (data) {
      setRecipients(data);
    }
  }, [supabase, deliveryId]);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      if (!token || !deliveryId) {
        setError("URL invalide ou informations manquantes.");
        setIsLoading(false);
        return;
      }
      try {
        const { data: deliveryData, error: deliveryError } = await supabase
          .from("deliveries")
          .select("*")
          .eq("id", deliveryId)
          .eq("public_token", token)
          .single();

        if (deliveryError || !deliveryData) {
          setError("Livraison introuvable, expirée ou lien invalide.");
          setIsLoading(false);
          return;
        }

        const { data: recipientsData } = await supabase
          .from("delivery_recipients")
          .select("*")
          .eq("delivery_id", deliveryId)
          .order("sort_order")
          .order("scheduled_at");

        setDelivery(deliveryData);
        if (recipientsData) {
          setRecipients(recipientsData);
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Une erreur est survenue lors du chargement des données.");
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [token, deliveryId, supabase]);

  useEffect(() => {
    if (!deliveryId || !token) return;

    const channelName = `delivery-tracking:${deliveryId}`;
    const channel = supabase.channel(channelName);

    channel
      .on<Delivery>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deliveries",
          filter: `id=eq.${deliveryId}`,
        },
        (payload) => {
          setDelivery(payload.new);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_recipients",
          filter: `delivery_id=eq.${deliveryId}`,
        },
        () => {
          void loadRecipients();
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setError(
            "La connexion au suivi en direct a été perdue. Réactualisez la page.",
          );
        }
      }, 30_000);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryId, token, supabase, loadRecipients]);

  if (isLoading) {
    return <TrackPageLoadingFallback />;
  }

  if (error) {
    return <TrackPageError message={error} />;
  }

  if (!delivery) {
    return null;
  }

  const hasPosition = delivery.latitude !== null && delivery.longitude !== null;
  // MapLibre/GeoJSON expect [longitude, latitude]
  const center: [number, number] = hasPosition
    ? [delivery.longitude!, delivery.latitude!]
    : [7.3622, 48.7426]; // Alsace, France [lng, lat]
  console.log("[TrackMap] center", {
    longitude: center[0],
    latitude: center[1],
  });

  return (
    <div className="relative z-0 h-full min-h-dvh w-full bg-gray-200 dark:bg-gray-800">
      <TrackMapClient
        center={center}
        delivery={delivery}
        hasPosition={hasPosition}
      />
      <AnimatePresence>
        {!delivery.is_tracking_active && <StoppedOverlay delivery={delivery} />}
      </AnimatePresence>
      {delivery.is_tracking_active && (
        <>
          <div className="absolute top-0 right-0 left-0 z-10 p-3 sm:p-4">
            <div className="mx-auto max-w-lg">
              <StatusPanel delivery={delivery} />
            </div>
          </div>
          <div className="absolute right-0 bottom-0 left-0 z-10 p-3 sm:p-4">
            <RecipientsPanel recipients={recipients} />
          </div>
        </>
      )}
    </div>
  );
}

export default function DeliveryTrackingPage() {
  return (
    <Suspense fallback={<TrackPageLoadingFallback />}>
      <DeliveryTrackingContent />
    </Suspense>
  );
}

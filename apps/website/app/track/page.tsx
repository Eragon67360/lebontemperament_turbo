"use client";

import { createClient } from "@/utils/supabase/client";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import type { Delivery, DeliveryRecipient } from "./shared";
import {
  DeliveredPanel,
  RecipientSinglePanel,
  RecipientsPanel,
  StatusPanel,
  StoppedOverlay,
  TrackPageError,
  TrackPageLoadingFallback,
} from "./shared";

const TrackMapClient = dynamic(
  () =>
    import("./[deliveryId]/TrackMapClient").then((mod) => mod.TrackMapClient),
  { ssr: false },
);

type ViewMode = "recipient" | "full";

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

function TrackByTokenContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [viewMode, setViewMode] = useState<ViewMode | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [recipient, setRecipient] = useState<DeliveryRecipient | null>(null);
  const [recipients, setRecipients] = useState<DeliveryRecipient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const loadRecipients = useCallback(
    async (deliveryId: string) => {
      const { data } = await supabase
        .from("delivery_recipients")
        .select("*")
        .eq("delivery_id", deliveryId)
        .order("sort_order")
        .order("scheduled_at");
      if (data) {
        setRecipients(data);
      }
    },
    [supabase],
  );

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
        // 1) Try recipient by public_token
        const { data: recipientData, error: recipientError } = await supabase
          .from("delivery_recipients")
          .select("*")
          .eq("public_token", token)
          .maybeSingle();

        if (!recipientError && recipientData) {
          const deliveryId = recipientData.delivery_id as string;
          const { data: deliveryData, error: deliveryError } = await supabase
            .from("deliveries")
            .select("*")
            .eq("id", deliveryId)
            .single();

          if (deliveryError || !deliveryData) {
            setError("Livraison introuvable ou expirée.");
            setIsLoading(false);
            return;
          }
          if (isExpired(deliveryData.expires_at)) {
            setError("Ce lien a expiré.");
            setIsLoading(false);
            return;
          }
          setViewMode("recipient");
          setRecipient(recipientData as DeliveryRecipient);
          setDelivery(deliveryData as Delivery);
          setRecipients([recipientData as DeliveryRecipient]);
          setIsLoading(false);
          return;
        }

        // 2) Try delivery by public_token
        const { data: deliveryData, error: deliveryError } = await supabase
          .from("deliveries")
          .select("*")
          .eq("public_token", token)
          .maybeSingle();

        if (!deliveryError && deliveryData) {
          if (isExpired(deliveryData.expires_at)) {
            setError("Ce lien a expiré.");
            setIsLoading(false);
            return;
          }
          setViewMode("full");
          setDelivery(deliveryData as Delivery);
          setRecipient(null);
          await loadRecipients(deliveryData.id);
          setIsLoading(false);
          return;
        }

        setError("Livraison introuvable, expirée ou lien invalide.");
      } catch (err) {
        console.error("Error resolving token:", err);
        setError("Une erreur est survenue lors du chargement des données.");
      } finally {
        setIsLoading(false);
      }
    }
    resolveToken();
  }, [token, supabase, loadRecipients]);

  useEffect(() => {
    if (!delivery || viewMode === null) return;

    const channelName = `delivery-tracking:${delivery.id}`;
    const channel = supabase.channel(channelName);

    channel
      .on<Delivery>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deliveries",
          filter: `id=eq.${delivery.id}`,
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
          filter: `delivery_id=eq.${delivery.id}`,
        },
        () => {
          if (viewMode === "full") {
            void loadRecipients(delivery.id);
          } else if (recipient) {
            supabase
              .from("delivery_recipients")
              .select("*")
              .eq("id", recipient.id)
              .single()
              .then(({ data }) => {
                if (data) setRecipient(data as DeliveryRecipient);
              });
          }
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
  }, [delivery?.id, viewMode, recipient?.id, supabase, loadRecipients]);

  if (isLoading) {
    return <TrackPageLoadingFallback />;
  }

  if (error) {
    return <TrackPageError message={error} />;
  }

  if (!delivery || viewMode === null) {
    return null;
  }

  const hasPosition = delivery.latitude !== null && delivery.longitude !== null;
  const center: [number, number] = hasPosition
    ? [delivery.latitude!, delivery.longitude!]
    : [48.7426, 7.3622];

  if (viewMode === "recipient" && recipient) {
    const isDelivered = !!recipient.delivered_at;
    return (
      <div className="relative z-0 h-full min-h-dvh w-full bg-gray-200 dark:bg-gray-800">
        <TrackMapClient
          center={center}
          delivery={delivery}
          hasPosition={hasPosition}
        />
        <AnimatePresence>
          {!delivery.is_tracking_active && (
            <StoppedOverlay delivery={delivery} />
          )}
        </AnimatePresence>
        {delivery.is_tracking_active && (
          <>
            <div className="absolute top-0 right-0 left-0 z-10 p-3 sm:p-4">
              <div className="mx-auto flex max-w-lg flex-col gap-3">
                {isDelivered ? (
                  <DeliveredPanel
                    deliveredAt={recipient.delivered_at!}
                    label={recipient.label}
                  />
                ) : (
                  <>
                    <StatusPanel delivery={delivery} />
                    <RecipientSinglePanel
                      recipient={recipient}
                      delivery={delivery}
                    />
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full view (delivery token)
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

export default function TrackByTokenPage() {
  return (
    <Suspense fallback={<TrackPageLoadingFallback />}>
      <TrackByTokenContent />
    </Suspense>
  );
}

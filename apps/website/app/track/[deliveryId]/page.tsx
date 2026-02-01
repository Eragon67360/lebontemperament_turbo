"use client";

import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { AlertCircle, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

// Load map only on client (Leaflet uses window)
const TrackMapClient = dynamic(
  () => import("./TrackMapClient").then((mod) => mod.TrackMapClient),
  { ssr: false },
);

interface Delivery {
  id: string;
  driver_id: string;
  public_token: string;
  latitude: number | null;
  longitude: number | null;
  is_tracking_active: boolean;
  expires_at: string;
  updated_at: string;
}

function DeliveryTrackingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const deliveryId = params.deliveryId as string;
  const token = searchParams.get("token");
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Validate token and load delivery
  useEffect(() => {
    async function loadDelivery() {
      if (!token) {
        setError("Token manquant dans l'URL.");
        setIsLoading(false);
        return;
      }

      if (!deliveryId) {
        setError("ID de livraison manquant dans l'URL.");
        setIsLoading(false);
        return;
      }

      try {
        // First, validate the token by fetching the delivery
        const { data, error: fetchError } = await supabase
          .from("deliveries")
          .select("*")
          .eq("id", deliveryId)
          .eq("public_token", token)
          .single();

        if (fetchError || !data) {
          setError("Livraison introuvable ou token invalide.");
          setIsLoading(false);
          return;
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          setError("Cette livraison a expiré.");
          setIsLoading(false);
          return;
        }

        setDelivery(data);
        setIsLoading(false);
        setMapReady(true);
      } catch (err) {
        console.error("Error loading delivery:", err);
        setError("Une erreur est survenue lors du chargement.");
        setIsLoading(false);
      }
    }

    loadDelivery();
  }, [token, deliveryId, supabase]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!delivery || !token) return;

    // Subscribe to changes for this specific delivery
    channelRef.current = supabase
      .channel(`delivery:${delivery.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deliveries",
          filter: `id=eq.${delivery.id}`,
        },
        (payload) => {
          const updatedDelivery = payload.new as Delivery;
          // If driver reset the token, this link is no longer valid
          if (updatedDelivery.public_token !== token) {
            setError(
              "Veuillez demander au conducteur de vous envoyer un lien valide.",
            );
            setDelivery(null);
            return;
          }
          setDelivery(updatedDelivery);
        },
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
    // Re-subscribe only when delivery id or token changes, not on every position update
    // eslint-disable-next-line react-hooks/exhaustive-deps -- delivery?.id and token are intentional
  }, [delivery?.id, token, supabase]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 transition-colors duration-200 dark:bg-gray-950">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Chargement du suivi...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 transition-colors duration-200 dark:bg-gray-950">
        <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-white p-4 shadow-sm transition-colors duration-200 sm:p-6 dark:border-red-900/50 dark:bg-gray-900 dark:shadow-none dark:ring-1 dark:ring-gray-800">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Erreur</h2>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return null;
  }

  // Tracking stopped: show only a grandiose white card, no map or position
  if (!delivery.is_tracking_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 px-4 py-12 transition-colors duration-200 dark:from-gray-900 dark:to-gray-950">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none dark:ring-1 dark:ring-gray-800">
          <div className="px-6 py-14 text-center sm:px-10 sm:py-16">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <MapPin
                className="h-12 w-12 text-gray-400 dark:text-gray-500"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-xs font-medium tracking-[0.2em] text-gray-400 uppercase dark:text-gray-500">
              Suivi de livraison
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-100">
              Suivi en direct indisponible
            </h1>
            <p className="mx-auto mt-6 max-w-sm text-base leading-relaxed text-gray-500 dark:text-gray-400">
              Le conducteur a arrêté le partage de sa position. Vous serez
              informé dès que le suivi en temps réel sera de nouveau actif.
            </p>
            <div className="mt-10 flex items-center justify-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" />
              Suivi arrêté
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasPosition = delivery.latitude !== null && delivery.longitude !== null;
  const center: [number, number] = hasPosition
    ? [delivery.latitude!, delivery.longitude!]
    : [48.7426, 7.3622]; // Default to Saverne, France

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 transition-colors duration-200 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b bg-white shadow-sm transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none dark:ring-1 dark:ring-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-gray-100">
                Suivi de livraison
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Position mise à jour en temps réel
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 transition-colors duration-200 dark:border-gray-700 dark:bg-gray-800">
              <div
                className={`h-2 w-2 rounded-full ${
                  delivery.is_tracking_active
                    ? "animate-pulse bg-green-500 dark:bg-green-400"
                    : "bg-gray-400 dark:bg-gray-500"
                }`}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {delivery.is_tracking_active ? "En cours" : "Arrêté"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Map: explicit height so Leaflet can compute layout */}
      <div className="relative h-[50vh] min-h-[300px] flex-1 sm:min-h-[400px]">
        {mapReady && (
          <TrackMapClient
            center={center}
            delivery={delivery}
            hasPosition={hasPosition}
          />
        )}

        {/* No position overlay (tracking active but no position yet) */}
        {!hasPosition && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/90">
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-lg transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none dark:ring-1 dark:ring-gray-800">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Position non disponible
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Le conducteur n&apos;a pas encore activé le suivi ou la position
                n&apos;a pas encore été enregistrée.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info footer */}
      {hasPosition && (
        <div className="border-t bg-white px-4 py-3 transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 dark:text-gray-500" />
                <span>
                  Dernière mise à jour:{" "}
                  {new Date(delivery.updated_at).toLocaleString("fr-FR")}
                </span>
              </div>
              <div className="break-all text-gray-500 dark:text-gray-500">
                Coordonnées: {delivery.latitude?.toFixed(6)},{" "}
                {delivery.longitude?.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrackPageLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 transition-colors duration-200 dark:bg-gray-950">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        <p className="text-gray-600 dark:text-gray-400">
          Chargement du suivi...
        </p>
      </div>
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

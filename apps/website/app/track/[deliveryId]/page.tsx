"use client";

import { createClient } from "@/utils/supabase/client";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, AlertTriangle, ShipWheel, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

// --- Data Interfaces ---
interface Delivery {
  id: string;
  driver_id: string;
  public_token: string;
  latitude: number | null;
  longitude: number | null;
  is_tracking_active: boolean;
  expires_at: string;
  updated_at: string;
  scheduled_at: string | null;
  is_delayed: boolean;
  delay_minutes: number | null;
  problem_message: string | null;
}

interface DeliveryRecipient {
  id: string;
  delivery_id: string;
  label: string;
  scheduled_at: string;
  sort_order: number;
}

// --- Dynamic Map Import (no changes) ---
const TrackMapClient = dynamic(
  () => import("./TrackMapClient").then((mod) => mod.TrackMapClient),
  { ssr: false },
);

// --- Helper Functions ---
function calculateETA(
  iso: string | null,
  delayMinutes: number | null,
): Date | null {
  if (!iso) return null;
  const scheduledDate = new Date(iso);
  if (delayMinutes && delayMinutes > 0) {
    scheduledDate.setMinutes(scheduledDate.getMinutes() + delayMinutes);
  }
  return scheduledDate;
}

function formatTime(date: Date | null): string {
  if (!date) return "--:--";
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Sub-Components ---

function StatusPanel({ delivery }: { delivery: Delivery }) {
  const eta = calculateETA(delivery.scheduled_at, delivery.delay_minutes);
  const isProblem = !!delivery.problem_message;
  const isDelayed = delivery.is_delayed;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="z-999 rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-lg sm:p-6 dark:border-gray-500/20 dark:bg-gray-900/70"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Arrivée estimée
          </p>
          <p className="text-4xl font-bold tracking-tighter text-gray-900 sm:text-5xl dark:text-gray-100">
            {formatTime(eta)}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold dark:bg-white/5">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-gray-700 dark:text-gray-300">En direct</span>
        </div>
      </div>

      <AnimatePresence>
        {(isDelayed || isProblem) && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: "16px" }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div
              className={clsx(
                "flex items-start gap-3 rounded-lg p-3 text-sm",
                isProblem
                  ? "border border-red-200 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300"
                  : "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
              )}
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                {isProblem ? (
                  <>
                    <span className="font-bold">Problème:</span>{" "}
                    {delivery.problem_message}
                  </>
                ) : (
                  <>
                    <span className="font-bold">En retard</span>
                    {delivery.delay_minutes != null &&
                      delivery.delay_minutes > 0 && (
                        <span> (~{delivery.delay_minutes} min)</span>
                      )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RecipientsPanel({ recipients }: { recipients: DeliveryRecipient[] }) {
  if (recipients.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
      className="z-10 mx-auto flex max-h-[40vh] w-full max-w-lg flex-col rounded-2xl border border-white/20 bg-white/70 shadow-xl backdrop-blur-lg dark:border-gray-500/20 dark:bg-gray-900/70"
    >
      <div className="shrink-0 border-b border-black/5 p-4 sm:p-6 dark:border-white/5">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
          <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span>Ordre de livraison</span>
        </h3>
      </div>

      <ul className="space-y-3 overflow-y-auto p-4 sm:p-6">
        {recipients.map((r, index) => (
          <li key={r.id} className="flex items-center gap-4">
            <div className="flex flex-col items-center self-stretch">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                {index + 1}
              </div>
              <div
                className={clsx("w-px grow bg-gray-300 dark:bg-gray-600", {
                  hidden: index === recipients.length - 1,
                })}
              />
            </div>
            <div className="py-1 text-sm">
              <span className="font-medium text-gray-800 dark:text-gray-300">
                {r.label}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {" "}
                – {formatTime(new Date(r.scheduled_at))}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function StoppedOverlay(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- prop kept for API
  { delivery }: { delivery: Delivery },
) {
  return (
    <div className="absolute inset-0 z-999 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-gray-900"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <ShipWheel
            className="h-8 w-8 text-gray-400 dark:text-gray-500"
            strokeWidth={1.5}
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Suivi en direct interrompu
        </h1>
        <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
          Le conducteur a mis le suivi en pause. Il sera réactivé prochainement.
        </p>
      </motion.div>
    </div>
  );
}

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

  // Initial Data Loading
  useEffect(() => {
    async function loadInitialData() {
      // ... same logic as before ...
      if (!token || !deliveryId) {
        setError("URL invalide.");
        setIsLoading(false);
        return;
      }
      try {
        const { data, error: fetchError } = await supabase
          .from("deliveries")
          .select("*")
          .eq("id", deliveryId)
          .eq("public_token", token)
          .maybeSingle();
        console.log("data", data);
        console.log("fetchError", fetchError);
        if (fetchError) {
          setError("Une erreur est survenue.");
          setIsLoading(false);
          return;
        }
        if (!data) {
          setError("Livraison introuvable, expirée ou lien invalide.");
          setIsLoading(false);
          return;
        }
        if (new Date(data.expires_at) < new Date()) {
          setError("Cette livraison a expiré.");
          setIsLoading(false);
          return;
        }
        setDelivery(data);
        const { data: recipientsData } = await supabase
          .from("delivery_recipients")
          .select("*")
          .eq("delivery_id", deliveryId)
          .order("sort_order")
          .order("scheduled_at");
        if (recipientsData) setRecipients(recipientsData);
      } catch {
        setError("Une erreur est survenue.");
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [token, deliveryId, supabase]);

  // Realtime subscription: only after we have a validated delivery (so token + row exist).
  // Ensure Database > Replication has "deliveries" and "delivery_recipients" in supabase_realtime.
  useEffect(() => {
    if (!delivery?.id || !token) return;

    const loadRecipients = async () => {
      const { data } = await supabase
        .from("delivery_recipients")
        .select("*")
        .eq("delivery_id", deliveryId)
        .order("sort_order")
        .order("scheduled_at");
      if (data) setRecipients(data);
    };

    const channel = supabase.channel(`delivery-tracking:${deliveryId}`, {
      config: {
        broadcast: { self: true },
      },
    });
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
          const updatedDelivery = payload.new;
          setDelivery(updatedDelivery);
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
        () => void loadRecipients(),
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(
            "Successfully subscribed to realtime channel with token!",
          );
        }
        if (status === "CHANNEL_ERROR") {
          console.error("Realtime channel error:", err);
          setError("La connexion au suivi en direct a été perdue.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [delivery?.id, token, supabase, deliveryId]);

  if (isLoading) {
    return <TrackPageLoadingFallback />;
  }

  if (error) {
    return (
      <div className="flex h-dvh min-h-dvh w-full items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-lg dark:border-red-900/50 dark:bg-gray-900">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Erreur de suivi</h2>
          </div>
          <p className="mt-3 text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return null; // Should be handled by error state
  }

  const hasPosition = delivery.latitude !== null && delivery.longitude !== null;
  const center: [number, number] = hasPosition
    ? [delivery.latitude!, delivery.longitude!]
    : [48.7426, 7.3622];

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
          <div className="absolute top-0 right-0 left-0 z-999 p-3 sm:p-4">
            <div className="mx-auto max-w-lg">
              <StatusPanel delivery={delivery} />
            </div>
          </div>
          <div className="absolute right-0 bottom-0 left-0 z-999 p-3 sm:p-4">
            <RecipientsPanel recipients={recipients} />
          </div>
        </>
      )}
    </div>
  );
}

function TrackPageLoadingFallback() {
  return (
    <div className="flex h-dvh min-h-dvh w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <ShipWheel className="h-10 w-10 animate-spin text-gray-400 dark:text-gray-500" />
        <p className="font-medium text-gray-600 dark:text-gray-400">
          Chargement du suivi en direct...
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

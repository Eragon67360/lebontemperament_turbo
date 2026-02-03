"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock, // <-- Import the Clock icon
  ShipWheel,
} from "lucide-react";
import type { ReactNode } from "react";

// --- Data Interfaces (No changes here) ---
export interface Delivery {
  id: string;
  public_token: string;
  latitude: number | null;
  longitude: number | null;
  is_tracking_active: boolean;
  expires_at: string;
  updated_at: string;
  scheduled_at: string | null;
  scheduled_end_at?: string | null;
  is_delayed: boolean;
  delay_minutes: number | null;
  problem_message: string | null;
  current_recipient_id?: string | null;
}

export interface DeliveryRecipient {
  id: string;
  delivery_id: string;
  label: string;
  scheduled_at?: string | null;
  public_token?: string;
  delivered_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

// --- Helper Functions (No changes here) ---
export function calculateETA(
  iso: string | null,
  delayMinutes: number | null,
): Date | null {
  if (!iso) return null;
  const scheduledDate = new Date(iso);
  if (delayMinutes != null && delayMinutes > 0) {
    scheduledDate.setMinutes(scheduledDate.getMinutes() + delayMinutes);
  }
  return scheduledDate;
}

export function formatTime(date: Date | null): string {
  if (!date) return "--:--";
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(date: Date | null): string {
  if (!date) return "--:--";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeRangeLabel(
  start: string | null,
  end: string | null,
  delayMinutes: number | null,
): string {
  if (!start) return "--:--";
  const startDate = calculateETA(start, delayMinutes);
  if (!end) return formatTime(startDate);
  const endDate = calculateETA(end, delayMinutes);
  return `${formatTime(startDate)} – ${formatTime(endDate)}`;
}

// --- UI Components (REFACTORED) ---

/**
 * A panel that shows delivery alerts (delay, problem).
 * Only rendered when there are alerts. Status badge is in RecipientSinglePanel.
 */
export function StatusPanel({ delivery }: { delivery: Delivery }) {
  const isProblem = !!delivery.problem_message;
  const isDelayed = delivery.is_delayed;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-lg sm:p-6 dark:border-gray-500/20 dark:bg-gray-900/70"
    >
      <AnimatePresence>
        {(isDelayed || isProblem) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
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

/**
 * A panel showing the specific recipient's information.
 * ETA is the hero; overall delivery window is secondary contextual info.
 */
export function RecipientSinglePanel({
  recipient,
  delivery,
  etaForCurrentRecipient = null,
  status,
}: {
  recipient: DeliveryRecipient;
  delivery: Delivery;
  etaForCurrentRecipient?: Date | null;
  status: "live" | "pending";
}) {
  const isInProgress = delivery.current_recipient_id === recipient.id;
  const scheduledTime =
    recipient.scheduled_at != null
      ? calculateETA(recipient.scheduled_at, delivery.delay_minutes)
      : null;

  const rangeLabel = formatTimeRangeLabel(
    delivery.scheduled_at,
    delivery.scheduled_end_at ?? null,
    delivery.delay_minutes,
  );
  const hasRange = delivery.scheduled_at && delivery.scheduled_end_at;

  // --- Smart ETA Label Generation ---
  const getSmartEtaLabel = (): string => {
    // If no live ETA is available, fallback to the scheduled time.
    if (!etaForCurrentRecipient) {
      return formatTime(scheduledTime);
    }

    const remainingSeconds =
      (etaForCurrentRecipient.getTime() - Date.now()) / 1000;
    const remainingMinutes = Math.round(remainingSeconds / 60);
    const absoluteTime = formatTime(etaForCurrentRecipient);

    // If the ETA is slightly in the past (due to network lag), show imminent.
    if (remainingSeconds < 0) {
      return `${absoluteTime} (arrivée imminente)`;
    }

    if (remainingMinutes <= 1) {
      return `${absoluteTime} (dans moins d'une minute)`;
    }
    // When remaining <= 15 min: show absolute time + remaining time next to it.
    if (remainingMinutes <= 15) {
      const plural = remainingMinutes > 1 ? "s" : "";
      return `${absoluteTime} (dans environ ${remainingMinutes} minute${plural})`;
    }
    // For longer ETAs, show only the absolute time.
    return `vers ${absoluteTime}`;
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
      className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-lg sm:p-6 dark:border-gray-500/20 dark:bg-gray-900/70"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Votre livraison
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100">
            {recipient.label}
          </p>

          {/* RENDER PATH 1: Delivery is IN PROGRESS (Live) - ETA as hero */}
          {isInProgress ? (
            <>
              <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                Arrivée prévue
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tighter text-gray-900 sm:text-5xl dark:text-gray-100">
                {getSmartEtaLabel()}
              </p>
              {hasRange && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Créneau prévu : {rangeLabel}
                </p>
              )}
            </>
          ) : (
            /* RENDER PATH 2: Delivery is PENDING */
            <>
              <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                Passage prévu
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tighter text-gray-900 sm:text-5xl dark:text-gray-100">
                {formatTime(scheduledTime)}
              </p>
              {hasRange && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Créneau prévu : {rangeLabel}
                </p>
              )}
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm">
                  Le suivi en direct s&apos;activera lorsque le conducteur sera
                  en route.
                </p>
              </div>
            </>
          )}
        </div>
        {/* Status badge */}
        <div
          className={clsx(
            "flex shrink-0 items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold dark:bg-white/5",
            status === "live"
              ? "text-gray-700 dark:text-gray-300"
              : "text-gray-600 dark:text-gray-400",
          )}
        >
          <div
            className={clsx("h-2 w-2 rounded-full", {
              "animate-pulse bg-green-500": status === "live",
              "bg-gray-400 dark:bg-gray-500": status === "pending",
            })}
          />
          <span>{status === "live" ? "En direct" : "Prévu"}</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * A confirmation panel shown when the item is delivered.
 */
export function DeliveredPanel({
  deliveredAt,
  label,
}: {
  deliveredAt: string;
  label: string;
}) {
  const date = new Date(deliveredAt);
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      className="w-full max-w-lg rounded-2xl border border-green-200 bg-green-50 p-6 shadow-xl dark:border-green-800/50 dark:bg-green-950/40"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-green-900 dark:text-green-100">
            Livré
          </h2>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            {label} – livré à {formatDateTime(date)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * An overlay shown when the driver has paused tracking.
 */
export function StoppedOverlay({ delivery }: { delivery: Delivery }) {
  void delivery; // Prop kept for API consistency
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
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

/**
 * A layout for the "Pending" state, showing info panels without a map.
 */
export function PendingPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-start justify-center bg-gray-100 p-3 pt-12 sm:p-4 sm:pt-16 dark:bg-gray-900">
      <div className="flex w-full max-w-lg flex-col gap-3">{children}</div>
    </div>
  );
}

/**
 * A fallback component to show while the page is loading.
 */
export function TrackPageLoadingFallback() {
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

/**
 * A component to display an error message with an optional refresh button.
 */
export function TrackPageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const handleRetry = onRetry ?? (() => window.location.reload());

  return (
    <div className="flex h-dvh min-h-dvh w-full items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-lg dark:border-red-900/50 dark:bg-gray-900">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Erreur de suivi</h2>
        </div>
        <p className="mt-3 text-gray-600 dark:text-gray-400">{message}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2.5 font-medium text-white transition hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Réactualiser la page
        </button>
      </div>
    </div>
  );
}

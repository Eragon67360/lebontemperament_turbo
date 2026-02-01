"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
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
 * A panel that shows the estimated time window and delivery status.
 * Now context-aware with a `status` prop.
 */
export function StatusPanel({
  delivery,
  status,
}: {
  delivery: Delivery;
  status: "live" | "pending";
}) {
  const hasRange = delivery.scheduled_at && delivery.scheduled_end_at;
  const label = hasRange ? "Créneau estimé" : "Arrivée estimée";
  const timeLabel = formatTimeRangeLabel(
    delivery.scheduled_at,
    delivery.scheduled_end_at ?? null,
    delivery.delay_minutes,
  );
  const isProblem = !!delivery.problem_message;
  const isDelayed = delivery.is_delayed;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-lg sm:p-6 dark:border-gray-500/20 dark:bg-gray-900/70"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="text-4xl font-bold tracking-tighter text-gray-900 sm:text-5xl dark:text-gray-100">
            {timeLabel}
          </p>
        </div>
        {/* -- Conditionally rendered status badge -- */}
        <div
          className={clsx(
            "flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold dark:bg-white/5",
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
      <AnimatePresence>
        {/* ... (delay/problem section remains the same) ... */}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * A panel showing the specific recipient's information.
 * HEAVILY REFACTORED for better UX in the pending state.
 */
export function RecipientSinglePanel({
  recipient,
  delivery,
  etaForCurrentRecipient = null,
}: {
  recipient: DeliveryRecipient;
  delivery: Delivery;
  etaForCurrentRecipient?: Date | null;
}) {
  const isInProgress = delivery.current_recipient_id === recipient.id;
  const scheduledTime =
    recipient.scheduled_at != null
      ? calculateETA(recipient.scheduled_at, delivery.delay_minutes)
      : null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
      className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-lg sm:p-6 dark:border-gray-500/20 dark:bg-gray-900/70"
    >
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        Votre livraison
      </p>
      <p className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100">
        {recipient.label}
      </p>

      {/* -- RENDER PATH 1: Delivery is IN PROGRESS -- */}
      {isInProgress ? (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Arrivée estimée (ETA) :{" "}
          <span className="font-semibold">
            {etaForCurrentRecipient
              ? `~ ${formatTime(etaForCurrentRecipient)}`
              : formatTime(scheduledTime)}
          </span>
        </p>
      ) : (
        /* -- RENDER PATH 2: Delivery is PENDING -- */
        <>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Passage prévu :{" "}
            <span className="font-semibold">{formatTime(scheduledTime)}</span>
          </p>
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm">
              Le suivi en direct s'activera lorsque le conducteur sera en route.
            </p>
          </div>
        </>
      )}
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
 * A component to display an error message.
 */
export function TrackPageError({ message }: { message: string }) {
  return (
    <div className="flex h-dvh min-h-dvh w-full items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-lg dark:border-red-900/50 dark:bg-gray-900">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Erreur de suivi</h2>
        </div>
        <p className="mt-3 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

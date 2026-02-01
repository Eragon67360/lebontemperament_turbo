"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ShipWheel,
  Users,
} from "lucide-react";

// --- Data Interfaces (shared by token-only and [deliveryId] pages) ---
export interface Delivery {
  id: string;
  driver_id: string;
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
}

export interface DeliveryRecipient {
  id: string;
  delivery_id: string;
  label: string;
  scheduled_at: string;
  sort_order: number;
  public_token?: string;
  delivered_at?: string | null;
}

// --- Helpers ---
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

// --- Sub-Components ---
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

export function StatusPanel({ delivery }: { delivery: Delivery }) {
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

export function RecipientsPanel({
  recipients,
}: {
  recipients: DeliveryRecipient[];
}) {
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

/** Single-recipient panel for token-only recipient view: "Votre livraison : [label], vers [time]" */
export function RecipientSinglePanel({
  recipient,
  delivery,
}: {
  recipient: DeliveryRecipient;
  delivery: Delivery;
}) {
  const hasRange = delivery.scheduled_at && delivery.scheduled_end_at;
  const eta = calculateETA(recipient.scheduled_at, delivery.delay_minutes);
  const globalLabel = hasRange ? "Créneau global" : "Prévision";
  const globalTime = hasRange
    ? formatTimeRangeLabel(
        delivery.scheduled_at,
        delivery.scheduled_end_at ?? null,
        delivery.delay_minutes,
      )
    : formatTime(eta);
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
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {globalLabel} : {globalTime}
      </p>
      {hasRange && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Votre passage prévu : {formatTime(eta)}
        </p>
      )}
    </motion.div>
  );
}

/** Delivered state panel for recipient view when delivered_at is set */
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
      className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-xl dark:border-green-800/50 dark:bg-green-950/40"
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

export function StoppedOverlay({ delivery }: { delivery: Delivery }) {
  void delivery; // kept for API; overlay content is static
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
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

export function TrackPageError({ message }: { message: string }) {
  return (
    <div className="flex h-dvh min-h-dvh w-full items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-lg dark:border-red-900/50 dark:bg-gray-900">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Erreur de suivi</h2>
        </div>
        <p className="mt-3 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

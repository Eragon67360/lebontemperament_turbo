"use client";

import { LinkButton } from "@/components/LinkButton";
import { useNow } from "@/hooks/useNow";
import { Button, Spinner } from "@heroui/react";
import clsx from "clsx";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShipWheel,
  Truck,
} from "lucide-react";
import { motion, MotionConfig } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { IoHome } from "react-icons/io5";

import { frenchClock, roundedWindow } from "@repo/domain/utils/parisClock";
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

// --- Helper Functions ---
//
// Times are the recipient's: Paris wall-clock, in the « 9 h 15 » style of
// the SMS, the pushes and the app, never the viewer's zone. The server and
// the browser then render the same digits (no hydration mismatch).
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

/** « 9 h 15 », « 14 h », Paris time; "--:--" while there is no time. */
export function formatTime(date: Date | null): string {
  if (!date) return "--:--";
  return frenchClock(date);
}

const PARIS_DAY = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "2-digit",
  month: "2-digit",
});

/** « 10 h 31 le 27/10 », Paris time, after « livré à ». */
export function formatDateTime(date: Date | null): string {
  if (!date) return "--:--";
  return `${frenchClock(date)} le ${PARIS_DAY.format(date)}`;
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

/**
 * The recipient's window: the scheduled time (plus the announced delay)
 * rounded to the nearest quarter hour, ±15 min, as the SMS and the pushes
 * announce it: 09:29 → « 9 h 15 – 9 h 45 ». "--:--" without a scheduled_at.
 */
export function formatRecipientRange(
  scheduledAt: string | null,
  delayMinutes: number | null,
): string {
  if (!scheduledAt) return "--:--";
  const base = calculateETA(scheduledAt, delayMinutes);
  if (!base) return "--:--";
  const { start, end } = roundedWindow(base);
  return `${formatTime(start)} – ${formatTime(end)}`;
}

// --- UI Components ---
//
// The page is opened from an SMS, mostly on a phone, by people who may never
// have seen the site: it follows the site's look (the tokens of
// `app/globals.css`, the same card as `not-found` and `/l/<code>`), in both
// themes, without stock greys or glass. Solid cards stay readable over the
// map whatever the tiles show.

/** The site's card: the page background on the grey surface, a soft line, a soft shadow. */
const CARD = "border-separator bg-background rounded-2xl border shadow-md";

/** The grey page behind the states that show no map. */
const PAGE = "bg-surface-secondary flex min-h-dvh w-full justify-center";

/**
 * A card that arrives with a short spring: from above, or growing from the
 * centre for the centred ones. `MotionConfig reducedMotion="user"` reads the
 * device's reduced-motion setting when the animation starts, so under it the
 * card only fades in, on the first paint too (the site's `useReducedMotion`
 * hook can only answer after mount, once an entrance has already started).
 */
function AnimatedCard({
  from = "above",
  delay = 0,
  role,
  className,
  children,
}: {
  from?: "above" | "centre";
  delay?: number;
  role?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        role={role}
        initial={
          from === "above"
            ? { y: -24, opacity: 0 }
            : { scale: 0.95, opacity: 0 }
        }
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: from === "above" ? 100 : 150,
          damping: 20,
          delay,
        }}
        className={clsx(CARD, className)}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}

/**
 * A panel that shows delivery alerts (delay, problem).
 * Only rendered when there are alerts. Status badge is in RecipientSinglePanel.
 */
export function StatusPanel({ delivery }: { delivery: Delivery }) {
  const isProblem = !!delivery.problem_message;
  const isDelayed = delivery.is_delayed;
  if (!isProblem && !isDelayed) return null;

  return (
    <AnimatedCard role="status" className="overflow-hidden">
      <div
        className={clsx(
          "text-foreground flex items-start gap-3 p-4 text-sm sm:px-6",
          isProblem ? "bg-danger-soft" : "bg-warning-soft",
        )}
      >
        <AlertTriangle
          className={clsx(
            "mt-0.5 h-5 w-5 shrink-0",
            isProblem
              ? "text-danger-soft-foreground"
              : "text-warning-soft-foreground",
          )}
          aria-hidden
        />
        <p>
          {isProblem ? (
            <>
              <span className="text-danger-soft-foreground font-semibold">
                Problème :
              </span>{" "}
              {delivery.problem_message}
            </>
          ) : (
            <>
              <span className="text-warning-soft-foreground font-semibold">
                En retard
              </span>
              {delivery.delay_minutes != null && delivery.delay_minutes > 0 && (
                <span> (~{delivery.delay_minutes} min)</span>
              )}
            </>
          )}
        </p>
      </div>
    </AnimatedCard>
  );
}

/**
 * Where the recipient's delivery stands on the page: `live` once the driver
 * is on the way to this recipient (map and ETA), `started` once the round
 * has started (`is_tracking_active`) but another stop comes first, `pending`
 * before that. Same stages as the app's « Votre livraison » screen.
 */
export type RecipientStatus = "live" | "started" | "pending";

const STATUS_BADGE: Record<RecipientStatus, string> = {
  live: "En direct",
  started: "Tournée en cours",
  pending: "Prévu",
};

/** The stage as a chip: a word, with a dot that pulses while live. */
function StatusChip({ status }: { status: RecipientStatus }) {
  return (
    <span className="bg-surface-secondary text-muted inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
      <span
        aria-hidden
        className={clsx("h-2 w-2 rounded-full", {
          "bg-success motion-safe:animate-pulse": status === "live",
          "bg-success": status === "started",
          "bg-muted": status === "pending",
        })}
      />
      {STATUS_BADGE[status]}
    </span>
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
  status: RecipientStatus;
}) {
  const isInProgress = delivery.current_recipient_id === recipient.id;
  // Ticks every few seconds so the "in N minutes" label keeps counting down.
  const now = useNow();
  const scheduledTime =
    recipient.scheduled_at != null
      ? calculateETA(recipient.scheduled_at, delivery.delay_minutes)
      : null;

  const rangeLabel =
    recipient.scheduled_at != null
      ? formatRecipientRange(recipient.scheduled_at, delivery.delay_minutes)
      : formatTimeRangeLabel(
          delivery.scheduled_at,
          delivery.scheduled_end_at ?? null,
          delivery.delay_minutes,
        );
  const hasRange =
    recipient.scheduled_at != null ||
    (delivery.scheduled_at != null && delivery.scheduled_end_at != null);

  // --- Smart ETA Label Generation ---
  const getSmartEtaLabel = (): string => {
    // If no live ETA is available, fallback to the scheduled time.
    if (!etaForCurrentRecipient) {
      return formatTime(scheduledTime);
    }

    const remainingSeconds = (etaForCurrentRecipient.getTime() - now) / 1000;
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
    <AnimatedCard delay={0.1} className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        {/* The page's title: « Votre livraison » then who it is for. */}
        <h1 className="flex min-w-0 flex-col">
          <span className="text-muted text-xs font-medium">
            Votre livraison
          </span>
          <span className="text-foreground mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            {recipient.label}
          </span>
        </h1>
        <StatusChip status={status} />
      </div>

      {/* RENDER PATH 1: Delivery is IN PROGRESS (Live) - ETA as hero */}
      {isInProgress ? (
        <>
          <p className="text-muted mt-3 text-xs font-medium">Arrivée prévue</p>
          <p className="text-foreground mt-1 text-4xl font-bold tracking-tighter sm:text-5xl">
            {getSmartEtaLabel()}
          </p>
          {hasRange && (
            <p className="text-muted mt-2 text-sm">
              Créneau prévu : {rangeLabel}
            </p>
          )}
        </>
      ) : (
        /* RENDER PATH 2: not on the way to this recipient yet - only show range, no exact time */
        <>
          {hasRange && (
            <>
              <p className="text-muted mt-3 text-xs font-medium">
                Créneau prévu
              </p>
              <p className="text-foreground mt-1 text-4xl font-bold tracking-tighter sm:text-5xl">
                {rangeLabel}
              </p>
            </>
          )}
          <div className="bg-surface-secondary text-foreground mt-4 flex items-start gap-3 rounded-xl p-3 text-sm">
            {status === "started" ? (
              <>
                <Truck
                  className="text-primary-text mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                <p>
                  <span className="font-semibold">
                    Notre tournée a commencé !
                  </span>{" "}
                  La carte s&apos;affichera ici dès que le livreur sera en route
                  vers chez vous.
                </p>
              </>
            ) : (
              <>
                <Clock
                  className="text-primary-text mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                <p>
                  Le suivi en direct s&apos;activera lorsque le conducteur sera
                  en route.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </AnimatedCard>
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
    <AnimatedCard from="centre" className="w-full max-w-lg p-6 sm:p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-success-soft text-success-soft-foreground flex h-14 w-14 items-center justify-center rounded-full">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <div>
          <h1 className="text-foreground text-xl font-bold sm:text-2xl">
            Livré
          </h1>
          <p className="text-muted mt-1 text-sm">
            {label} – livré à {formatDateTime(date)}
          </p>
        </div>
      </div>
    </AnimatedCard>
  );
}

/**
 * An overlay shown when the driver has paused tracking.
 */
export function StoppedOverlay({ delivery }: { delivery: Delivery }) {
  void delivery; // Prop kept for API consistency
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
      <AnimatedCard
        role="status"
        from="centre"
        className="w-full max-w-md p-6 text-center shadow-xl sm:p-8"
      >
        <div className="bg-surface-secondary text-muted mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full">
          <ShipWheel className="h-7 w-7" strokeWidth={1.5} aria-hidden />
        </div>
        <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
          Suivi en direct interrompu
        </h1>
        <p className="text-muted mt-3">
          Le conducteur a mis le suivi en pause. Il sera réactivé prochainement.
        </p>
      </AnimatedCard>
    </div>
  );
}

/**
 * What happens to the recipient's data, with a link to the privacy policy.
 */
export function TrackPrivacyNotice() {
  return (
    <p className="text-muted px-1 text-center text-xs">
      Vos coordonnées servent uniquement à cette livraison et sont effacées 30
      jours après la tournée.{" "}
      <Link
        href="/politique-de-confidentialite"
        className="text-primary-text underline underline-offset-2"
      >
        Politique de confidentialité
      </Link>
    </p>
  );
}

/**
 * A layout for the "Pending" state, showing info panels without a map.
 */
export function PendingPanel({ children }: { children: ReactNode }) {
  return (
    <main className={clsx(PAGE, "items-start p-3 pt-12 sm:p-4 sm:pt-16")}>
      <div className="flex w-full max-w-lg flex-col gap-3">
        {children}
        <TrackPrivacyNotice />
      </div>
    </main>
  );
}

/**
 * A fallback component to show while the page is loading.
 */
export function TrackPageLoadingFallback() {
  return (
    <main className={clsx(PAGE, "items-center p-4")}>
      <div role="status" className="flex flex-col items-center gap-4">
        <Spinner size="lg" aria-hidden />
        <p className="text-muted font-medium">
          Chargement du suivi en direct...
        </p>
      </div>
    </main>
  );
}

/**
 * A component to display an error message with an optional refresh button.
 * It is a dead end for the person who opened the link, so it also leads
 * back to the site and to the contact page.
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
    <main className={clsx(PAGE, "items-center p-4")}>
      <section
        aria-labelledby="track-error-title"
        className={clsx(CARD, "w-full max-w-md p-6 text-center sm:p-8")}
      >
        <div className="bg-primary-50 dark:bg-primary-900/60 text-primary mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full">
          <AlertCircle className="h-7 w-7" aria-hidden />
        </div>
        <h1
          id="track-error-title"
          className="text-foreground text-xl font-bold sm:text-2xl"
        >
          Erreur de suivi
        </h1>
        <p className="text-muted mt-3">{message}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkButton href="/" variant="primary" size="lg">
            <IoHome className="shrink-0" aria-hidden />
            Retour à l’accueil
          </LinkButton>
          <Button variant="outline" size="lg" onPress={handleRetry}>
            Réactualiser la page
          </Button>
        </div>
        <p className="text-muted mt-6 text-sm">
          Une question sur votre livraison ?{" "}
          <Link
            href="/contact"
            className="text-primary-text underline underline-offset-2"
          >
            Nous contacter
          </Link>
        </p>
      </section>
    </main>
  );
}

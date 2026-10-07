"use client";

import { PageHeader } from "@/components/layouts/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useConcerts } from "@/hooks/useConcerts";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { parseIsoDate, todayIso } from "@/utils/concerts/schedule";
import { greetingFr, homeIntroFr } from "@/utils/home/greeting";
import { pickNextConcert } from "@/utils/home/nextConcert";
import { useMemo, useSyncExternalStore } from "react";

/** « Camille » from « Camille Martin »; empty when there is no name. */
export function firstNameOf(displayName: string | null | undefined): string {
  if (!displayName) return "";
  return displayName.trim().split(/\s+/)[0] ?? "";
}

// The admin's clock, on the client only: the server has no idea of the
// admin's day or hour, and a value rendered there would mismatch at
// hydration. The snapshot changes once per hour, so « Bonsoir » arrives at
// 18 h and the date turns at midnight on a page left open.
function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}
function clockKey(): string {
  const now = new Date();
  return `${todayIso(now)}T${String(now.getHours()).padStart(2, "0")}`;
}
function useClock(): Date | null {
  const key = useSyncExternalStore(subscribe, clockKey, () => null);
  return useMemo(() => {
    if (!key) return null;
    const [day = "", hour] = key.split("T");
    const date = parseIsoDate(day);
    date?.setHours(Number(hour));
    return date;
  }, [key]);
}

/**
 * « Bonjour Camille » (« Bonsoir » from 18 h), then today's date and one
 * sentence: the countdown to the next concert, or « Voici ce qui vous
 * attend. » when none is planned.
 */
export function DashboardWelcomeHeader() {
  const { data: user, isLoading } = useCurrentUser();
  const concerts = useConcerts();
  const now = useClock();

  const name = firstNameOf(
    user?.user_metadata?.display_name || user?.user_metadata?.name,
  );
  const greeting = now ? greetingFr(now) : "Bonjour";
  // undefined while the concerts load: the date alone, then the sentence is
  // added once (never one sentence swapped for another).
  const concert = concerts.isLoading
    ? undefined
    : now
      ? pickNextConcert(concerts.data, now)
      : null;
  const intro = now
    ? { ...homeIntroFr(now, concert), iso: todayIso(now) }
    : null;

  return (
    <PageHeader
      title={
        isLoading ? (
          <>
            {greeting}{" "}
            <Skeleton
              className="inline-block h-7 w-36 align-middle"
              aria-hidden
            />
          </>
        ) : name ? (
          `${greeting} ${name}`
        ) : (
          greeting
        )
      }
      intro={
        intro ? (
          <>
            <time dateTime={intro.iso}>{intro.date}</time>
            {intro.sentence && ` ${intro.sentence}`}
          </>
        ) : (
          // Same line height before the clock is known (no layout shift).
          <span aria-hidden>&nbsp;</span>
        )
      }
      help={
        <>
          <p>
            <strong>À faire</strong> rassemble ce qui attend une décision de
            votre part, du plus pressant au moins pressant. Quand la liste est
            vide, tout est à jour.
          </p>
          <p>
            <strong>Que voulez-vous faire ?</strong> reprend les espaces du menu
            de gauche, avec ce qui vous y attend.
          </p>
          <p>
            Rien n’est modifié depuis cette page : chaque bouton ouvre l’écran
            concerné, où vous décidez.
          </p>
        </>
      }
    />
  );
}

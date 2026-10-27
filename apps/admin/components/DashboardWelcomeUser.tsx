"use client";

import { PageHeader } from "@/components/layouts/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useConcerts } from "@/hooks/useConcerts";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { greetingFr, homeIntroFr } from "@/utils/home/greeting";
import { pickNextConcert } from "@/utils/home/nextConcert";
import { parisToday } from "@repo/domain/utils/parisDay";
import { useMemo, useSyncExternalStore } from "react";

/** « Camille » from « Camille Martin »; empty when there is no name. */
export function firstNameOf(displayName: string | null | undefined): string {
  if (!displayName) return "";
  return displayName.trim().split(/\s+/)[0] ?? "";
}

// The admin's clock, on the client only: the server has no idea of the
// admin's hour, and a value rendered there would mismatch at hydration. The
// snapshot is the top of the current hour, as an instant, so it changes once
// per hour: « Bonsoir » arrives at 18 h on the admin's own clock, and the
// date (the Paris day) turns at midnight in Paris on a page left open.
function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}
function clockKey(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return String(now.getTime());
}
function useClock(): Date | null {
  const key = useSyncExternalStore(subscribe, clockKey, () => null);
  return useMemo(() => (key ? new Date(Number(key)) : null), [key]);
}

/**
 * « Bonjour Camille » (« Bonsoir » from 18 h), then today's date and one
 * sentence: the countdown to the next concert, or « Voici ce qui vous
 * attend. » when none is planned.
 */
export function DashboardWelcomeHeader() {
  const { isLoading: isLoadingUser } = useCurrentUser();
  const { data: profile, isLoading: isLoadingProfile } = useCurrentProfile();
  const isLoading = isLoadingUser || isLoadingProfile;
  const concerts = useConcerts();
  const now = useClock();

  // The name on the profile, not the account's metadata.
  const name = firstNameOf(profile?.display_name);
  const greeting = now ? greetingFr(now) : "Bonjour";
  // undefined while the concerts load: the date alone, then the sentence is
  // added once (never one sentence swapped for another).
  const concert = concerts.isLoading
    ? undefined
    : now
      ? pickNextConcert(concerts.data, now)
      : null;
  const intro = now
    ? { ...homeIntroFr(now, concert), iso: parisToday(now) }
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

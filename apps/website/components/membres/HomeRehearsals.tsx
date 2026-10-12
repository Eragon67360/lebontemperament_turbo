"use client";

import { useMemberRehearsals } from "@/hooks/useMemberRehearsals";
import {
  formatTimeRange,
  formatTimeSpan,
  hasDirections,
  mapsUrl,
  parseLocalDate,
  placeLine,
  upcomingRehearsals,
  whenLabel,
} from "@/lib/membres/rehearsals";
import type { MemberRehearsal } from "@/lib/publicConcerts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import NextLink from "next/link";
import {
  IoArrowForwardOutline,
  IoLocationOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { GroupChip } from "./GroupChip";
import { MembersLinkButton } from "./MembersButton";
import { MembersCard } from "./MembersCard";
import { RehearsalDateBlock } from "./RehearsalDateBlock";
import { GROUP_LABEL } from "./tones";

const CALENDAR_HREF = "/membres/calendrier";

function AllRehearsalsLink() {
  return (
    <NextLink
      href={CALENDAR_HREF}
      className="text-primary-text inline-flex min-h-12 items-center gap-2 font-medium no-underline hover:underline"
    >
      Toutes les répétitions
      <IoArrowForwardOutline aria-hidden="true" className="h-5 w-5" />
    </NextLink>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]" aria-busy="true">
      <p role="status" className="sr-only">
        Chargement des répétitions…
      </p>
      <MembersCard className="flex animate-pulse flex-col gap-6 p-5 sm:p-8">
        <div className="bg-primary/10 h-8 w-3/5 rounded-lg" />
        <div className="flex gap-6">
          <div className="bg-primary/10 h-28 w-24 shrink-0 rounded-2xl sm:w-32" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="bg-primary/10 h-7 w-32 rounded-lg" />
            <div className="bg-primary/10 h-6 w-3/4 rounded-lg" />
            <div className="bg-primary/10 h-6 w-2/3 rounded-lg" />
          </div>
        </div>
        <div className="bg-primary/10 h-[52px] w-full rounded-xl sm:w-48" />
      </MembersCard>
      <MembersCard className="flex animate-pulse flex-col gap-4 p-5 sm:p-7">
        <div className="bg-primary/10 h-7 w-24 rounded-lg" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-primary/10 h-16 w-full rounded-lg" />
        ))}
      </MembersCard>
    </div>
  );
}

function NextRehearsalCard({ rehearsal }: { rehearsal: MemberRehearsal }) {
  const date = parseLocalDate(rehearsal.date);
  const place = placeLine(rehearsal);
  const showName =
    rehearsal.name.trim() !== "" &&
    rehearsal.name.trim().toLowerCase() !==
      GROUP_LABEL[rehearsal.group_type].toLowerCase();

  return (
    <MembersCard
      as="article"
      aria-labelledby="home-next"
      className="flex flex-col gap-6 p-5 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="home-next"
          className="text-foreground text-[21px] font-semibold sm:text-[26px]"
        >
          Ta prochaine répétition
        </h2>
        <span className="bg-primary/10 text-primary-text rounded-full px-3.5 py-1 text-base font-medium">
          {whenLabel(date)}
        </span>
      </div>

      <div className="flex items-start gap-4 sm:gap-7">
        <RehearsalDateBlock date={date} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <GroupChip group={rehearsal.group_type} className="self-start" />
          {showName && (
            <p className="text-foreground font-medium">{rehearsal.name}</p>
          )}
          <p className="text-foreground flex items-center gap-2.5 text-lg font-medium sm:text-xl">
            <IoTimeOutline
              aria-hidden="true"
              className="text-primary h-[22px] w-[22px] shrink-0"
            />
            {formatTimeRange(rehearsal.start_time, rehearsal.end_time)}
          </p>
          {place && (
            <p className="flex items-start gap-2.5">
              <IoLocationOutline
                aria-hidden="true"
                className="text-primary mt-1 h-[22px] w-[22px] shrink-0"
              />
              <span className="min-w-0 break-words">{place}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {hasDirections(rehearsal) && (
          <MembersLinkButton
            href={mapsUrl(rehearsal)}
            external
            className="w-full sm:w-auto"
          >
            <IoLocationOutline aria-hidden="true" className="h-5 w-5" />
            Voir l’itinéraire
          </MembersLinkButton>
        )}
        <MembersLinkButton
          href={CALENDAR_HREF}
          variant="outline"
          className="w-full sm:w-auto"
        >
          Toutes les répétitions
        </MembersLinkButton>
      </div>
    </MembersCard>
  );
}

function LaterRehearsals({ rehearsals }: { rehearsals: MemberRehearsal[] }) {
  return (
    <MembersCard
      as="section"
      aria-labelledby="home-later"
      className="flex flex-col p-5 sm:p-7"
    >
      <h2
        id="home-later"
        className="text-foreground mb-2 text-[21px] font-semibold sm:text-[22px]"
      >
        Ensuite
      </h2>
      <ul>
        {rehearsals.map((rehearsal) => {
          const date = parseLocalDate(rehearsal.date);
          const place = placeLine(rehearsal);
          return (
            <li
              key={rehearsal.id}
              className="border-members-line flex gap-4 border-b py-3.5 last:border-b-0"
            >
              <div
                className="w-14 shrink-0 text-center leading-tight sm:w-16"
                aria-label={format(date, "EEEE d MMMM", { locale: fr })}
                role="img"
              >
                <div
                  aria-hidden="true"
                  className="text-muted text-sm font-medium uppercase"
                >
                  {format(date, "EEE", { locale: fr })}
                </div>
                <div aria-hidden="true" className="text-2xl font-semibold">
                  {format(date, "d", { locale: fr })}
                </div>
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="font-medium">
                  {GROUP_LABEL[rehearsal.group_type]}
                </span>
                <span className="text-muted text-base">
                  {formatTimeSpan(rehearsal.start_time, rehearsal.end_time)}
                </span>
                {place && (
                  <span className="text-muted text-base break-words">
                    {place}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-2">
        <AllRehearsalsLink />
      </div>
    </MembersCard>
  );
}

/** « Ta prochaine répétition » and the three after it, from `/api/rehearsals`. */
export function HomeRehearsals() {
  const state = useMemberRehearsals();

  if (state.status === "loading") return <Skeleton />;

  if (state.status === "error") {
    return (
      <MembersCard className="flex flex-col items-start gap-4 p-5 sm:p-8">
        <h2 className="text-[21px] font-semibold sm:text-[26px]">
          Ta prochaine répétition
        </h2>
        <p role="alert">
          Les répétitions n’ont pas pu être chargées. Réessaie dans un instant.
        </p>
        <MembersLinkButton href={CALENDAR_HREF} variant="outline">
          Toutes les répétitions
        </MembersLinkButton>
      </MembersCard>
    );
  }

  const [next, ...others] = upcomingRehearsals(state.rehearsals);

  if (!next) {
    return (
      <MembersCard className="flex flex-col items-start gap-4 p-5 sm:p-8">
        <h2 className="text-[21px] font-semibold sm:text-[26px]">
          Ta prochaine répétition
        </h2>
        <p>Pas de répétition prévue pour l’instant.</p>
        <MembersLinkButton href={CALENDAR_HREF} variant="outline">
          Toutes les répétitions
        </MembersLinkButton>
      </MembersCard>
    );
  }

  const later = others.slice(0, 3);
  return (
    <div
      className={`grid gap-6 ${later.length > 0 ? "lg:grid-cols-[2fr_1fr]" : ""}`}
    >
      <NextRehearsalCard rehearsal={next} />
      {later.length > 0 && <LaterRehearsals rehearsals={later} />}
    </div>
  );
}

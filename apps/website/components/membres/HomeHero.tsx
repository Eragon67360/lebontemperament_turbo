import {
  formatTimeSpan,
  hasDirections,
  mapsUrl,
  parseLocalDate,
  placeLine,
  whenLabel,
} from "@/lib/membres/rehearsals";
import type { VoiceKey } from "@/lib/membres/voices";
import type { MemberRehearsal } from "@/lib/publicConcerts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { IoLocationOutline } from "react-icons/io5";
import { ChoirArc } from "./ChoirArc";
import { GroupChip } from "./GroupChip";
import { MembersLinkButton } from "./MembersButton";
import { VOICE_FILL } from "./tones";

const CALENDAR_HREF = "/membres/calendrier";

/** « Ta prochaine répétition, c'est demain. » */
function nextSentence(next: MemberRehearsal): string {
  const when = whenLabel(parseLocalDate(next.date));
  if (when === "Aujourd’hui")
    return "Ta prochaine répétition, c’est aujourd’hui.";
  if (when === "Demain") return "Ta prochaine répétition, c’est demain.";
  return `Ta prochaine répétition, c’est ${when.toLowerCase()}.`;
}

function NextCard({ next }: { next: MemberRehearsal }) {
  const date = parseLocalDate(next.date);
  const place = placeLine(next);
  return (
    <article
      aria-label="Ta prochaine répétition"
      className="bg-members-card text-foreground flex flex-col gap-3 rounded-[28px] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <GroupChip group={next.group_type} />
        <span className="bg-members-band rounded-full px-3.5 py-1 text-base font-medium">
          {whenLabel(date)}
        </span>
      </div>
      <p className="font-members-display text-[22px] leading-tight font-semibold first-letter:uppercase sm:text-2xl">
        {format(date, "EEEE d MMMM", { locale: fr })}
        {next.start_time && (
          <span className="font-medium">
            {" · "}
            {formatTimeSpan(next.start_time, next.end_time)}
          </span>
        )}
      </p>
      {place && (
        <p className="text-members-muted flex items-start gap-2">
          <IoLocationOutline
            aria-hidden="true"
            className="mt-1 h-5 w-5 shrink-0"
          />
          <span className="min-w-0 break-words">{place}</span>
        </p>
      )}
      <div className="mt-1 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        {hasDirections(next) && (
          <MembersLinkButton href={mapsUrl(next)} external size="md">
            Itinéraire
          </MembersLinkButton>
        )}
        <MembersLinkButton href={CALENDAR_HREF} variant="outline" size="md">
          Toutes les répétitions
        </MembersLinkButton>
      </div>
    </article>
  );
}

/**
 * The top of the members home: the member's voice colour as a big block,
 * the greeting, their next rehearsal and their place in the choir.
 */
export function HomeHero({
  firstName,
  voice,
  voiceLabel,
  rehearsals,
}: {
  firstName: string;
  /** Null while unknown: the block stays grey. */
  voice: VoiceKey | null;
  voiceLabel: string;
  rehearsals:
    | { status: "loading" }
    | { status: "error" }
    | { status: "ready"; next: MemberRehearsal | null };
}) {
  const colored = voice !== null;
  const surface = colored
    ? `${VOICE_FILL[voice]}`
    : "bg-members-band text-foreground";
  const inChoir = voice !== null && voice !== "jeune";

  return (
    <section
      aria-labelledby="home-hello"
      className={`grid gap-6 overflow-hidden rounded-[32px] p-5 sm:rounded-[40px] sm:p-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10 lg:p-12 ${surface}`}
    >
      <div className="flex min-w-0 flex-col gap-5">
        {voiceLabel && (
          <span className="self-start rounded-full bg-[#17171c] px-4 py-1.5 text-base font-medium text-white">
            Ta voix · {voiceLabel}
          </span>
        )}
        <div className="flex flex-col gap-2">
          <h1
            id="home-hello"
            className="font-members-display text-[40px] leading-[1.02] font-semibold tracking-tight break-words sm:text-[56px] lg:text-[64px]"
          >
            Salut{firstName ? ` ${firstName}` : ""}&nbsp;!
          </h1>
          <p className="text-xl leading-snug sm:text-2xl">
            {rehearsals.status === "ready" && rehearsals.next
              ? nextSentence(rehearsals.next)
              : rehearsals.status === "ready"
                ? "Pas de répétition prévue pour l’instant."
                : rehearsals.status === "error"
                  ? "Les répétitions n’ont pas pu être chargées. Réessaie dans un instant."
                  : " "}
          </p>
        </div>
        {rehearsals.status === "loading" && (
          <div
            aria-busy="true"
            className="bg-members-card/70 h-48 animate-pulse rounded-[28px]"
          >
            <p role="status" className="sr-only">
              Chargement des répétitions…
            </p>
          </div>
        )}
        {rehearsals.status === "ready" && rehearsals.next && (
          <NextCard next={rehearsals.next} />
        )}
        {rehearsals.status !== "loading" &&
          !(rehearsals.status === "ready" && rehearsals.next) && (
            <MembersLinkButton
              href={CALENDAR_HREF}
              size="md"
              className="self-start"
            >
              Toutes les répétitions
            </MembersLinkButton>
          )}
      </div>
      <div className="flex min-w-0 flex-col items-center justify-end gap-3">
        <ChoirArc
          mine={inChoir ? voice : null}
          onColor={colored}
          size="small"
          className="max-w-[300px] sm:max-w-[460px]"
        />
        <p className="font-members-display text-base font-medium sm:text-lg">
          {inChoir ? "Ta place dans le chœur" : "Le chœur et l’orchestre"}
        </p>
      </div>
    </section>
  );
}

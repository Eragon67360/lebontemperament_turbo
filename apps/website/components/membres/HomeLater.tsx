import {
  formatTimeSpan,
  parseLocalDate,
  placeLine,
} from "@/lib/membres/rehearsals";
import type { VoiceKey } from "@/lib/membres/voices";
import type { MemberRehearsal } from "@/lib/publicConcerts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import NextLink from "next/link";
import { IoArrowForwardOutline } from "react-icons/io5";
import { GroupChip } from "./GroupChip";
import { VOICE_TINT } from "./tones";

/** « Ensuite pour toi »: the member's next rehearsals after the first one. */
export function HomeLater({
  voice,
  rehearsals,
  personal,
}: {
  voice: VoiceKey | null;
  rehearsals: MemberRehearsal[];
  /** False when the voice is unknown and the list holds every group. */
  personal: boolean;
}) {
  return (
    <section
      aria-labelledby="home-later"
      className={`flex flex-col gap-4 rounded-[32px] p-5 sm:p-8 ${VOICE_TINT[voice ?? "none"]}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="home-later"
          className="font-members-display text-[26px] font-semibold sm:text-[30px]"
        >
          {personal ? "Ensuite pour toi" : "Ensuite"}
        </h2>
        <NextLink
          href="/membres/calendrier"
          className="text-foreground inline-flex min-h-11 items-center gap-2 font-medium underline underline-offset-4 hover:no-underline"
        >
          Toutes les dates
          <IoArrowForwardOutline aria-hidden="true" className="h-5 w-5" />
        </NextLink>
      </div>
      {rehearsals.length === 0 ? (
        <p className="bg-members-card rounded-[22px] p-5">
          Rien d’autre de prévu pour l’instant.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rehearsals.map((rehearsal) => {
            const date = parseLocalDate(rehearsal.date);
            const place = placeLine(rehearsal);
            return (
              <li
                key={rehearsal.id}
                className="bg-members-card flex items-center gap-4 rounded-[22px] p-2.5 pr-4"
              >
                <div
                  role="img"
                  aria-label={format(date, "EEEE d MMMM", { locale: fr })}
                  className="bg-members-band flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[18px] leading-none"
                >
                  <span
                    aria-hidden="true"
                    className="text-members-muted text-sm font-medium uppercase"
                  >
                    {format(date, "EEE", { locale: fr }).replace(".", "")}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-members-display mt-1 text-2xl font-semibold"
                  >
                    {format(date, "d", { locale: fr })}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <GroupChip group={rehearsal.group_type} />
                    <span className="font-medium">
                      {formatTimeSpan(rehearsal.start_time, rehearsal.end_time)}
                    </span>
                  </div>
                  {place && (
                    <span className="text-members-muted text-base break-words">
                      {place}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

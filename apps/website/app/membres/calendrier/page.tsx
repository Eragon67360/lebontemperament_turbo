"use client";
import GoogleCalendar from "@/components/GoogleCalendar";
import { FilterButton } from "@/components/membres/FilterButton";
import { GroupChip } from "@/components/membres/GroupChip";
import { membersButtonClass } from "@/components/membres/MembersButton";
import { MembersCard } from "@/components/membres/MembersCard";
import { PageHeader } from "@/components/membres/PageHeader";
import { RehearsalDateBlock } from "@/components/membres/RehearsalDateBlock";
import { GROUP_LABEL } from "@/components/membres/tones";
import { useMemberRehearsals } from "@/hooks/useMemberRehearsals";
import {
  formatTimeRange,
  parseLocalDate,
  placeLine,
  upcomingRehearsals,
} from "@/lib/membres/rehearsals";
import { GROUP_TYPES, GroupType } from "@repo/domain/types/rehearsals";
import { useState } from "react";
import {
  IoCalendarClearOutline,
  IoListOutline,
  IoLocationOutline,
  IoTimeOutline,
} from "react-icons/io5";

const Calendrier = () => {
  const [showGoogleCalendar, setShowGoogleCalendar] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupType | "all">("all");
  const state = useMemberRehearsals();

  // Only today's and future rehearsals, in the chosen group
  const filteredRehearsals =
    state.status === "ready"
      ? upcomingRehearsals(state.rehearsals).filter(
          (rehearsal) =>
            selectedGroup === "all" || rehearsal.group_type === selectedGroup,
        )
      : [];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        current="Les répétitions"
        title="Les répétitions"
        intro="Les dates, les horaires et les adresses des prochaines répétitions."
      />

      <div className="flex flex-col gap-5">
        <div className="flex">
          <button
            type="button"
            onClick={() => setShowGoogleCalendar(!showGoogleCalendar)}
            className={membersButtonClass("outline")}
          >
            {showGoogleCalendar ? (
              <>
                <IoListOutline aria-hidden="true" className="h-5 w-5" />
                Vue liste
              </>
            ) : (
              <>
                <IoCalendarClearOutline
                  aria-hidden="true"
                  className="h-5 w-5"
                />
                Calendrier complet
              </>
            )}
          </button>
        </div>

        {!showGoogleCalendar && (
          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 p-0 font-bold">Afficher</legend>
            <div className="flex flex-wrap gap-2.5">
              <FilterButton
                label="Tous les groupes"
                pressed={selectedGroup === "all"}
                onPress={() => setSelectedGroup("all")}
              />
              {GROUP_TYPES.map((group) => (
                <FilterButton
                  key={group}
                  label={GROUP_LABEL[group]}
                  pressed={selectedGroup === group}
                  onPress={() => setSelectedGroup(group)}
                />
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {showGoogleCalendar ? (
        <MembersCard className="overflow-hidden p-2 sm:p-4">
          <GoogleCalendar embedId={"lebontemperament@gmail.com"} />
        </MembersCard>
      ) : (
        <MembersCard className="overflow-hidden p-0">
          {state.status === "loading" && (
            <div aria-busy="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border-members-line flex animate-pulse gap-4 border-t px-4 py-4 first:border-t-0 sm:px-6"
                >
                  <div className="bg-primary/10 h-[88px] w-[72px] shrink-0 rounded-xl" />
                  <div className="flex flex-1 flex-col gap-2.5 pt-1">
                    <div className="bg-primary/10 h-6 w-48 max-w-full rounded" />
                    <div className="bg-primary/10 h-5 w-40 max-w-full rounded" />
                    <div className="bg-primary/10 h-5 w-56 max-w-full rounded" />
                  </div>
                </div>
              ))}
              <p role="status" className="sr-only">
                Chargement des répétitions…
              </p>
            </div>
          )}
          {state.status === "error" && (
            <p role="alert" className="p-6 sm:p-8">
              Les répétitions n’ont pas pu être chargées. Réessaie dans un
              instant.
            </p>
          )}
          {state.status === "ready" && filteredRehearsals.length === 0 && (
            <p className="p-6 sm:p-8">
              {selectedGroup === "all"
                ? "Pas de répétition prévue pour l’instant."
                : "Pas de répétition prévue pour ce groupe. Choisis « Tous les groupes » pour voir les autres."}
            </p>
          )}
          {state.status === "ready" && filteredRehearsals.length > 0 && (
            <ul>
              {filteredRehearsals.map((rehearsal) => {
                const place = placeLine(rehearsal);
                return (
                  <li
                    key={rehearsal.id}
                    className="border-members-line hover:bg-primary/5 flex gap-4 border-t px-4 py-4 first:border-t-0 sm:gap-5 sm:px-6"
                  >
                    <RehearsalDateBlock
                      date={parseLocalDate(rehearsal.date)}
                      size="small"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <h2 className="text-[19px] leading-snug font-extrabold">
                          {rehearsal.name}
                        </h2>
                        <GroupChip group={rehearsal.group_type} />
                      </div>
                      <p className="flex items-center gap-2.5 font-bold">
                        <IoTimeOutline
                          aria-hidden="true"
                          className="text-primary h-5 w-5 shrink-0"
                        />
                        {formatTimeRange(
                          rehearsal.start_time,
                          rehearsal.end_time,
                        )}
                      </p>
                      {place && (
                        <p className="text-muted flex items-start gap-2.5">
                          <IoLocationOutline
                            aria-hidden="true"
                            className="text-primary mt-0.5 h-5 w-5 shrink-0"
                          />
                          <span className="min-w-0 break-words">{place}</span>
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </MembersCard>
      )}
    </div>
  );
};

export default Calendrier;

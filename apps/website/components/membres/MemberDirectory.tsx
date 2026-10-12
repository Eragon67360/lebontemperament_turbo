"use client";

import {
  extractVoiceWords,
  groupByLastName,
  hasVoice,
  matchesSearch,
  voiceFilterLabel,
  type Member,
} from "@/lib/membres/directory";
import { useEffect, useMemo, useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { FilterButton } from "./FilterButton";
import { MemberRow } from "./MemberRow";
import { MembersCard } from "./MembersCard";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; members: Member[] };

function ListSkeleton() {
  return (
    <div aria-busy="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="border-members-line flex animate-pulse items-center gap-4 border-t px-4 py-3.5 first:border-t-0 sm:px-6"
        >
          <div className="bg-primary/10 h-[52px] w-[52px] shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="bg-primary/10 h-5 w-40 rounded" />
            <div className="bg-primary/10 h-4 w-56 max-w-full rounded" />
          </div>
        </div>
      ))}
      <p role="status" className="sr-only">
        Chargement des membres…
      </p>
    </div>
  );
}

/** The directory: search, voice filters, members grouped by family name. */
export function MemberDirectory() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/membres")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to fetch members");
        const members: unknown = await response.json();
        if (!Array.isArray(members)) throw new Error("Not a list");
        // Filter out empty rows and normalize data
        const validData: Member[] = (members as Member[])
          .filter((member) => member["NOM Prénom"]?.trim())
          .map((member) => ({
            "NOM Prénom": member["NOM Prénom"]?.trim() || "",
            "Adresse mail": member["Adresse mail"]?.trim() || "",
            Voix: member.Voix?.trim() || "",
            photoUrl: member.photoUrl,
          }));
        if (!cancelled) setState({ status: "ready", members: validData });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const members = useMemo(
    () => (state.status === "ready" ? state.members : []),
    [state],
  );

  // One filter per voice word that exists in the data
  const voiceFilters = useMemo(() => {
    const words = extractVoiceWords(
      Array.from(new Set(members.map((member) => member.Voix))).filter(Boolean),
    );
    return words.map((word) => ({
      word,
      label: voiceFilterLabel(word),
      count: members.filter((member) => hasVoice(member, word)).length,
    }));
  }, [members]);

  const groups = useMemo(
    () =>
      groupByLastName(
        members.filter(
          (member) =>
            matchesSearch(member, searchTerm) &&
            (selectedVoice === "" || hasVoice(member, selectedVoice)),
        ),
      ),
    [members, searchTerm, selectedVoice],
  );
  const total = groups.reduce((sum, group) => sum + group.members.length, 0);

  return (
    <div className="flex flex-col gap-7">
      <MembersCard className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="member-search" className="font-medium">
            Chercher un membre
          </label>
          <div className="border-members-line-strong bg-members-card focus-within:border-primary flex min-h-[60px] items-center gap-3 rounded-[14px] border-2 px-4">
            <IoSearchOutline
              aria-hidden="true"
              className="text-muted h-6 w-6 shrink-0"
            />
            <input
              id="member-search"
              type="search"
              autoComplete="off"
              placeholder="Tape un prénom ou un nom"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="text-foreground placeholder:text-muted min-h-14 min-w-0 flex-1 bg-transparent text-[19px] outline-none"
            />
          </div>
        </div>
        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-2.5 p-0 font-medium">Afficher</legend>
          <div className="flex flex-wrap gap-2.5">
            <FilterButton
              label="Tout le monde"
              count={members.length}
              pressed={selectedVoice === ""}
              onPress={() => setSelectedVoice("")}
            />
            {voiceFilters.map((filter) => (
              <FilterButton
                key={filter.word}
                label={filter.label}
                count={filter.count}
                pressed={selectedVoice === filter.word}
                onPress={() => setSelectedVoice(filter.word)}
              />
            ))}
          </div>
        </fieldset>
      </MembersCard>

      <section aria-label="Liste des membres" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p aria-live="polite" className="font-medium">
            {state.status === "ready" &&
              (total === 0
                ? "Aucun membre"
                : `${total} membre${total > 1 ? "s" : ""}, classés par nom de famille`)}
          </p>
          <p className="text-muted text-base">
            Tu vois le nom, la voix, l’adresse e-mail et la photo de chaque
            membre.
          </p>
        </div>

        <MembersCard className="overflow-hidden p-0">
          {state.status === "loading" && <ListSkeleton />}
          {state.status === "error" && (
            <p role="alert" className="p-6 sm:p-8">
              La liste des membres n’a pas pu être chargée. Réessaie dans un
              instant.
            </p>
          )}
          {state.status === "ready" && total === 0 && (
            <p className="p-6 sm:p-8">
              Personne ne correspond. Vérifie l’orthographe, ou choisis « Tout
              le monde ».
            </p>
          )}
          {state.status === "ready" &&
            groups.map((group) => (
              <div
                key={group.letter}
                className="border-members-line border-t first:border-t-0"
              >
                <h2 className="bg-members-band text-primary-text px-4 py-2 text-[17px] font-semibold sm:px-6">
                  {group.letter}
                </h2>
                <ul>
                  {group.members.map((member, index) => (
                    <MemberRow
                      key={`${member["Adresse mail"]}-${index}`}
                      member={member}
                    />
                  ))}
                </ul>
              </div>
            ))}
        </MembersCard>
      </section>
    </div>
  );
}

"use client";

import { useMemberDirectory } from "@/hooks/useMemberDirectory";
import {
  groupByLastName,
  matchesSearch,
  type Member,
} from "@/lib/membres/directory";
import { VOICE_LABEL, voiceKeys, type VoiceKey } from "@/lib/membres/voices";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { ChoirArc } from "./ChoirArc";
import { MemberCard } from "./MemberCard";
import { VOICE_HEX } from "./tones";

/** A section of the choir, or « Autres » for voices the roster doesn't name. */
type Section = VoiceKey | "autres";

const SECTIONS: readonly Section[] = [
  "soprane",
  "alte",
  "tenor",
  "basse",
  "orchestre",
  "jeune",
  "autres",
];

const SECTION_LABEL: Record<Section, string> = {
  ...VOICE_LABEL,
  autres: "Autres",
};

/** The sections drawn on the seating plan (the young choir sits elsewhere). */
const ON_ARC = new Set<Section>([
  "soprane",
  "alte",
  "tenor",
  "basse",
  "orchestre",
]);

function sectionsOf(member: Member): Section[] {
  const keys = voiceKeys(member.Voix);
  return keys.length > 0 ? keys : ["autres"];
}

function parseSection(value: string | null): Section | null {
  return SECTIONS.find((section) => section === value) ?? null;
}

function SectionButton({
  label,
  count,
  dot,
  pressed,
  onPress,
}: {
  label: string;
  count: number;
  /** The section's colour; null for « Tout le monde » (ink). */
  dot: string | null;
  pressed: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPress}
      className={`inline-flex min-h-12 items-center gap-2.5 rounded-full border-2 py-1 pr-4 pl-1.5 text-lg font-medium transition-colors ${
        pressed
          ? "bg-members-ink text-members-ink-foreground border-members-ink"
          : "bg-members-card text-foreground border-members-line-strong hover:bg-members-band"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-8 w-8 shrink-0 rounded-full ring-[1.5px] ring-inset ${
          pressed ? "ring-members-ink-foreground/80" : "ring-members-ink/80"
        } ${dot === null ? (pressed ? "bg-members-ink-foreground" : "bg-members-ink") : ""}`}
        style={dot === null ? undefined : { backgroundColor: dot }}
      />
      {label}
      <span
        className={`rounded-full px-2 text-[15px] ${
          pressed
            ? "bg-members-ink-foreground/20"
            : "bg-members-band text-members-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function GridSkeleton() {
  return (
    <div aria-busy="true">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-3.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="border-members-line flex animate-pulse items-center gap-4 rounded-[28px] border-2 p-3.5"
          >
            <div className="bg-members-band h-[60px] w-[60px] shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="bg-members-band h-5 w-40 max-w-full rounded-full" />
              <div className="bg-members-band h-4 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <p role="status" className="sr-only">
        Chargement des membres…
      </p>
    </div>
  );
}

/**
 * « Le chœur, pupitre par pupitre »: the seating plan, one button per
 * section (`?voix=alte` opens on one), a search, then everyone as cards
 * sorted by family name.
 */
export function MemberDirectory() {
  const directory = useMemberDirectory();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Section | null>(() =>
    parseSection(searchParams.get("voix")),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const members = useMemo(
    () => (directory.status === "ready" ? directory.members : []),
    [directory],
  );

  const counts = useMemo(() => {
    const counted = new Map<Section, number>();
    for (const member of members) {
      for (const section of sectionsOf(member)) {
        counted.set(section, (counted.get(section) ?? 0) + 1);
      }
    }
    return counted;
  }, [members]);

  const shown = useMemo(
    () =>
      groupByLastName(
        members.filter(
          (member) =>
            matchesSearch(member, searchTerm) &&
            (selected === null || sectionsOf(member).includes(selected)),
        ),
      ).flatMap((group) => group.members),
    [members, searchTerm, selected],
  );

  const heading =
    selected === null
      ? "Tout le monde, de A à Z"
      : `${SECTION_LABEL[selected]}, de A à Z`;

  async function copyEmail(member: Member): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(member["Adresse mail"]);
      setAnnouncement(`Adresse de ${member["NOM Prénom"]} copiée.`);
      return true;
    } catch {
      setAnnouncement(
        "La copie n’a pas marché. Sélectionne l’adresse pour la copier.",
      );
      return false;
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <section
        aria-label="Les pupitres"
        className="bg-members-band flex flex-col items-center gap-6 rounded-[32px] p-5 sm:rounded-[40px] sm:p-10"
      >
        <div className="flex w-full max-w-[420px] flex-col gap-2 self-start">
          <label htmlFor="member-search" className="font-medium">
            Chercher quelqu’un
          </label>
          <div className="border-members-line-strong bg-members-card focus-within:outline-members-ink flex min-h-14 items-center gap-3 rounded-full border-2 px-5 focus-within:outline-2 focus-within:outline-offset-2">
            <IoSearchOutline
              aria-hidden="true"
              className="text-members-muted h-6 w-6 shrink-0"
            />
            <input
              id="member-search"
              type="search"
              autoComplete="off"
              placeholder="Prénom ou nom"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="text-foreground placeholder:text-members-muted min-h-12 min-w-0 flex-1 bg-transparent text-lg outline-none"
            />
          </div>
        </div>

        <ChoirArc
          only={
            selected !== null && ON_ARC.has(selected)
              ? (selected as VoiceKey)
              : null
          }
          conductor
          className="max-w-[640px]"
        />

        <fieldset className="m-0 flex flex-col items-center gap-3 border-0 p-0">
          <legend className="sr-only">Afficher un pupitre</legend>
          <div className="flex flex-wrap justify-center gap-2.5">
            <SectionButton
              label="Tout le monde"
              count={members.length}
              dot={null}
              pressed={selected === null}
              onPress={() => setSelected(null)}
            />
            {SECTIONS.filter((section) => counts.has(section)).map(
              (section) => (
                <SectionButton
                  key={section}
                  label={SECTION_LABEL[section]}
                  count={counts.get(section) ?? 0}
                  dot={VOICE_HEX[section === "autres" ? "none" : section]}
                  pressed={selected === section}
                  onPress={() =>
                    setSelected(selected === section ? null : section)
                  }
                />
              ),
            )}
          </div>
        </fieldset>
      </section>

      <section aria-labelledby="directory-list" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
          <h2
            id="directory-list"
            className="font-members-display text-[26px] font-semibold sm:text-[32px]"
          >
            {heading}
          </h2>
          <p aria-live="polite" className="text-members-muted">
            {directory.status === "ready" &&
              (shown.length === 0
                ? "Personne"
                : `${shown.length} membre${shown.length > 1 ? "s" : ""}`)}
          </p>
        </div>

        {directory.status === "loading" && <GridSkeleton />}
        {directory.status === "error" && (
          <p role="alert" className="bg-members-band rounded-[28px] p-6">
            La liste des membres n’a pas pu être chargée. Réessaie dans un
            instant.
          </p>
        )}
        {directory.status === "ready" && shown.length === 0 && (
          <p className="bg-members-band rounded-[28px] p-6">
            Personne ne correspond. Vérifie l’orthographe, ou choisis « Tout le
            monde ».
          </p>
        )}
        {directory.status === "ready" && shown.length > 0 && (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-3.5">
            {shown.map((member, index) => (
              <MemberCard
                key={`${member["Adresse mail"]}-${index}`}
                member={member}
                onCopy={() => copyEmail(member)}
              />
            ))}
          </ul>
        )}
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </section>
    </div>
  );
}

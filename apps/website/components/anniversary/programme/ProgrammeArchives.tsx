"use client";

import type { ProgrammePoster } from "@/lib/anniversaryProgramme";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ProgrammeHeading from "./ProgrammeHeading";
import { PROGRAMME_PARTS } from "./sections";
import { BUTTON_TEAL, CAPS, DISPLAY } from "./theme";

interface StackCard {
  key: string;
  kind: string;
  title: string;
  meta: string;
  image: string;
}

// The disc of the 20 years opens the pile: it is in the repository.
const ALBUM: StackCard = {
  key: "album-20-ans",
  kind: "Disque",
  title: "Les 20 ans",
  meta: "1987 — 2007",
  image: "/music/BT - Album/bt_20ans_pochette.jpg",
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function posterMeta(date: string | null): string {
  if (!date) return "Concert";
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? "Concert" : dateFormat.format(parsed);
}

interface ProgrammeArchivesProps {
  posters: ProgrammePoster[];
}

/**
 * « Les archives »: a fanned pile of the 20-years disc and recent concert
 * posters. Choosing a piece brings it on top and names it; the full
 * archives (minutes, programmes, documents) open on /40-ans/archives.
 */
export default function ProgrammeArchives({ posters }: ProgrammeArchivesProps) {
  const cards: StackCard[] = [
    ALBUM,
    ...posters.map((p) => ({
      key: p.id,
      kind: "Affiche",
      title: p.title,
      meta: posterMeta(p.date),
      image: p.image,
    })),
  ];
  const [top, setTop] = useState(0);
  const count = cards.length;
  const current = cards[Math.min(top, count - 1)]!;
  const middle = (count - 1) / 2;

  return (
    <section
      id="archives"
      className="scroll-mt-20 overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div>
          <ProgrammeHeading
            part={PROGRAMME_PARTS.archives!.part}
            title="Les archives"
            intro="Affiches, programmes, disques, comptes rendus d’assemblée générale. Feuilletez la pile, puis ouvrez les archives complètes."
          />
          <div aria-live="polite">
            <p className={`${DISPLAY} mt-8 text-2xl text-(--p-teal) italic`}>
              {current.title}
            </p>
            <p className={`${CAPS} mt-2 text-(--p-muted)`}>
              {current.kind} · {current.meta}
            </p>
          </div>
          <Link href="/40-ans/archives" className={`${BUTTON_TEAL} mt-8`}>
            Consulter les archives
          </Link>
        </div>

        <div
          role="group"
          aria-label="Pile d’archives : choisissez une pièce"
          className="relative mx-auto h-[360px] w-full max-w-[640px] [--card-h:308px] [--card-w:220px] [--step:24px] sm:h-[500px] sm:[--card-h:420px] sm:[--card-w:300px] sm:[--step:56px]"
        >
          {cards.map((card, i) => {
            const order = (i - top + count) % count;
            const isTop = order === 0;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setTop(i)}
                aria-pressed={isTop}
                aria-label={`${card.title}, ${card.kind.toLowerCase()}, ${card.meta}`}
                className="absolute top-8 h-(--card-h) w-(--card-w) origin-bottom cursor-pointer bg-white p-[18px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(.2,.7,.1,1)] hover:shadow-[0_26px_50px_-18px_rgba(0,0,0,0.55)] motion-reduce:transition-none"
                style={{
                  left: `calc(var(--step) * ${i})`,
                  zIndex: count - order,
                  transform: isTop
                    ? "translateY(-18px)"
                    : `rotate(${(i - middle) * 4}deg)`,
                }}
              >
                <span className="relative block size-full">
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    sizes="300px"
                    className="object-contain"
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

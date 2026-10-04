"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import {
  SCORE_FINALE_YEAR,
  SCORE_FIRST_YEAR,
  SCORE_MEASURE_COUNT,
  buildScore,
  firstNoteYear,
  scoreYear,
  type ScoreMeasure,
} from "@/lib/anniversaryScore";
import type { Memory, Photo, TimelineEvent } from "@/types/anniversary";
import { RoundedSize } from "@/utils/types";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Fermata from "./Fermata";
import ScoreHeading, { SCORE_FONT } from "./ScoreHeading";
import { SECTION_MARKS } from "./sections";

const PLAY_STEP_MS = 380;
// Top of the note head in a 65 px staff (lines every 16 px), by pitch.
const HEAD_TOP = [
  "top-[41px]",
  "top-[33px]",
  "top-[25px]",
  "top-[17px]",
  "top-[9px]",
];
const STAFF_LINES =
  "bg-[repeating-linear-gradient(to_bottom,currentColor_0,currentColor_1px,transparent_1px,transparent_16px)]";

interface ScoreTimelineProps {
  events: TimelineEvent[];
  memories: Memory[];
  photos: Photo[];
  /** Shown on a silent measure when the memory form is open. */
  onWriteMemory?: (year: number) => void;
}

function measureLabel(m: ScoreMeasure): string {
  const count = m.entries.length;
  if (count === 0) return `${m.year}, silence`;
  return `${m.year}, ${count} ${count > 1 ? "souvenirs" : "souvenir"}`;
}

/**
 * « La partition des 40 ans »: forty measures, one per year since 1987, ten
 * per line, then the anniversary as a fermata. Timeline events and featured
 * memories are the notes; silent years invite a memory. The measures are a
 * radio group (arrow keys move the selection) and « Jouer la partition »
 * walks through them.
 */
export default function ScoreTimeline({
  events,
  memories,
  photos,
  onWriteMemory,
}: ScoreTimelineProps) {
  const score = useMemo(() => buildScore(events, memories), [events, memories]);
  const measures = useMemo(
    () => [...score.lines.flatMap((l) => l.measures), score.finale],
    [score],
  );
  const [selected, setSelected] = useState(() => firstNoteYear(score));
  const [playing, setPlaying] = useState(false);
  const selectedRef = useRef(selected);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const next = selectedRef.current + 1;
      if (next > SCORE_FINALE_YEAR) {
        setPlaying(false);
        return;
      }
      selectedRef.current = next;
      setSelected(next);
    }, PLAY_STEP_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    selectedRef.current = SCORE_FIRST_YEAR;
    setSelected(SCORE_FIRST_YEAR);
    setPlaying(true);
  };

  const select = (year: number, focus = false) => {
    setPlaying(false);
    setSelected(year);
    if (focus) document.getElementById(`score-measure-${year}`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, year: number) => {
    const moves: Record<string, number> = {
      ArrowRight: year + 1,
      ArrowDown: year + 1,
      ArrowLeft: year - 1,
      ArrowUp: year - 1,
      Home: SCORE_FIRST_YEAR,
      End: SCORE_FINALE_YEAR,
    };
    const target = moves[e.key];
    if (target === undefined) return;
    e.preventDefault();
    select(
      Math.min(Math.max(target, SCORE_FIRST_YEAR), SCORE_FINALE_YEAR),
      true,
    );
  };

  const current = measures.find((m) => m.year === selected) ?? measures[0]!;
  const isFinale = current.year === SCORE_FINALE_YEAR;
  const photo = photos.find(
    (p) => p.year !== null && scoreYear(p.year) === current.year,
  );

  const radioProps = (m: ScoreMeasure) => ({
    id: `score-measure-${m.year}`,
    type: "button" as const,
    role: "radio",
    "aria-checked": m.year === selected,
    "aria-label": measureLabel(m),
    tabIndex: m.year === selected ? 0 : -1,
    onClick: () => select(m.year),
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => onKeyDown(e, m.year),
  });

  return (
    <section
      id="timeline"
      className="bg-surface-secondary/40 border-separator text-foreground border-y py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <ScoreHeading
            kicker={SECTION_MARKS.timeline!}
            title="La partition des 40 ans"
            intro="Une mesure par année, une ligne par décennie. Les notes sont nos souvenirs ; les silences attendent les vôtres."
          />
          <button
            type="button"
            onClick={togglePlay}
            aria-pressed={playing}
            className="bg-primary-solid hover:bg-primary-solid-hover inline-flex min-h-12 items-center gap-2.5 rounded-full px-6 font-medium text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              {playing ? (
                <>
                  <rect
                    x="3"
                    y="2"
                    width="3.5"
                    height="12"
                    fill="currentColor"
                  />
                  <rect
                    x="9.5"
                    y="2"
                    width="3.5"
                    height="12"
                    fill="currentColor"
                  />
                </>
              ) : (
                <path d="M4 2 L14 8 L4 14 Z" fill="currentColor" />
              )}
            </svg>
            {playing ? "Arrêter" : "Jouer la partition"}
          </button>
        </div>

        <div
          role="radiogroup"
          aria-label={`Les ${SCORE_MEASURE_COUNT} mesures, une par année`}
          className="mt-10"
        >
          {score.lines.map((line) => (
            <div
              key={line.label}
              className="mt-7 grid items-end gap-3 lg:grid-cols-[120px_minmax(0,1fr)] lg:gap-4"
            >
              <p
                className={`${SCORE_FONT} text-muted text-lg italic lg:pb-5 lg:text-right`}
              >
                {line.label}
              </p>
              <div className="border-foreground grid grid-cols-5 border-l-[3px] sm:grid-cols-10">
                {line.measures.map((m) => {
                  const isSelected = m.year === selected;
                  return (
                    <button
                      key={m.year}
                      {...radioProps(m)}
                      className="group flex cursor-pointer flex-col gap-1.5 text-left"
                    >
                      <span
                        className={`h-3.5 pl-2 text-[13px] leading-none ${
                          isSelected
                            ? "text-primary-text font-bold"
                            : "text-muted"
                        }`}
                      >
                        {m.year}
                      </span>
                      <span
                        className={`border-foreground relative block h-[65px] border-r-[1.5px] transition-colors ${STAFF_LINES} ${
                          isSelected
                            ? "bg-primary/15 text-primary"
                            : "text-foreground group-hover:bg-primary/5"
                        }`}
                      >
                        {m.entries.length > 0 ? (
                          <span
                            className={`absolute left-1/2 -ml-2.5 h-3.5 w-5 ${HEAD_TOP[m.pitch]}`}
                          >
                            <span className="absolute inset-0 -rotate-[22deg] rounded-full bg-current" />
                            <span className="absolute right-px bottom-1/2 h-10 w-[1.5px] bg-current" />
                          </span>
                        ) : (
                          <span className="absolute top-[17px] left-1/2 -ml-2 h-[7px] w-4 bg-current" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-7 flex justify-end">
            <button
              {...radioProps(score.finale)}
              aria-label={`${SCORE_FINALE_YEAR}, point d'orgue : les 40 ans`}
              className={`${SCORE_FONT} text-primary-text flex min-h-12 cursor-pointer items-end gap-4 rounded-sm px-3 text-lg italic ${
                isFinale ? "bg-primary/15" : "hover:bg-primary/5"
              }`}
            >
              {SCORE_FINALE_YEAR} · point d&apos;orgue
              <Fermata className="text-primary h-8 w-14" />
            </button>
          </div>
        </div>

        <div
          aria-live={playing ? "off" : "polite"}
          className={`border-foreground bg-background mt-12 grid gap-10 rounded-sm border p-6 sm:p-9 ${
            photo ? "lg:grid-cols-[1fr_1.3fr]" : ""
          }`}
        >
          <div className="flex flex-col gap-3">
            <p className="text-muted text-sm tracking-[0.12em] uppercase">
              {isFinale
                ? "Point d’orgue · les 40 ans"
                : `Mesure ${current.number} sur ${SCORE_MEASURE_COUNT}`}
            </p>
            <p
              className={`${SCORE_FONT} text-primary text-[4.5rem] leading-[0.9] font-light sm:text-[6rem]`}
            >
              {current.year}
            </p>
            {current.entries.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-6">
                {current.entries.map((entry) => (
                  <li key={`${entry.kind}-${entry.id}`}>
                    {entry.kind === "event" ? (
                      <>
                        <h3 className={`${SCORE_FONT} text-3xl font-medium`}>
                          {entry.title}
                        </h3>
                        <p className="text-foreground/85 mt-2 text-lg leading-relaxed">
                          {entry.text}
                        </p>
                      </>
                    ) : (
                      <figure>
                        <blockquote
                          className={`${SCORE_FONT} text-2xl leading-snug font-light italic`}
                        >
                          « {entry.text} »
                        </blockquote>
                        <figcaption className="text-muted mt-2">
                          {entry.name}
                        </figcaption>
                      </figure>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <h3 className={`${SCORE_FONT} mt-2 text-3xl font-medium`}>
                  Un silence, pour l&apos;instant
                </h3>
                <p className="text-foreground/85 text-lg leading-relaxed">
                  Aucun souvenir n&apos;est encore inscrit dans cette mesure.
                </p>
                {onWriteMemory && (
                  <a
                    href="#memories"
                    onClick={() => onWriteMemory(current.year)}
                    className="text-primary-text font-medium underline-offset-4 hover:underline"
                  >
                    Vous étiez là en {current.year} ? Écrivez cette mesure →
                  </a>
                )}
              </>
            )}
          </div>
          {photo && (
            <figure className="flex flex-col gap-2">
              <CloudinaryImage
                src={photo.image_url}
                alt={photo.title}
                width={900}
                height={675}
                rounded={RoundedSize.NONE}
                className="aspect-4/3 w-full object-cover"
              />
              <figcaption className="text-muted text-sm">
                {photo.title}
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}

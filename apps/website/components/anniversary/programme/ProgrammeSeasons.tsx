import CloudinaryImage from "@/components/CloudinaryImage";
import { buildSeasons } from "@/lib/anniversaryProgramme";
import type { Memory, Photo, TimelineEvent } from "@/types/anniversary";
import { RoundedSize } from "@/utils/types";
import { useMemo } from "react";
import ProgrammeHeading from "./ProgrammeHeading";
import { PROGRAMME_PARTS } from "./sections";
import { CAPS, DISPLAY, TEXT } from "./theme";

interface ProgrammeSeasonsProps {
  events: TimelineEvent[];
  memories: Memory[];
  photos: Photo[];
  /** Offered on every season when the memory form is open. */
  onWriteMemory?: (year: number) => void;
}

/**
 * « Première partie · Quarante saisons »: the timeline of the CMS, one
 * season per event (year in Bodoni, title, text), with the gallery photo of
 * that year and the featured memories of the period.
 */
export default function ProgrammeSeasons({
  events,
  memories,
  photos,
  onWriteMemory,
}: ProgrammeSeasonsProps) {
  const seasons = useMemo(
    () => buildSeasons(events, memories, photos),
    [events, memories, photos],
  );
  if (seasons.length === 0) return null;

  return (
    <section
      id="timeline"
      className="scroll-mt-20 px-4 pt-16 pb-8 sm:px-6 sm:pt-20 lg:px-8"
    >
      <div className="mx-auto max-w-[1180px]">
        <ProgrammeHeading
          part={PROGRAMME_PARTS.timeline!.part}
          title="Quarante saisons"
          intro="Les grandes dates de l’ensemble. Chaque saison attend aussi vos souvenirs."
          className="mb-10"
        />
        <ol>
          {seasons.map(({ event, photo, memories: quotes }, i) => {
            const accent = i === 0 || i === seasons.length - 1;
            return (
              <li
                key={event.id}
                className={`grid items-start gap-6 border-t border-(--p-rule) py-10 md:gap-10 ${
                  photo
                    ? "md:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_300px]"
                    : "md:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]"
                }`}
              >
                <p
                  className={`${DISPLAY} text-[56px] leading-[0.9] font-medium tracking-[-0.02em] sm:text-[64px] ${
                    accent ? "text-(--p-teal)" : ""
                  }`}
                >
                  {event.year}
                </p>
                <div className="max-w-2xl">
                  <h3
                    className={`${DISPLAY} text-[28px] leading-tight font-medium sm:text-[34px]`}
                  >
                    {event.title}
                  </h3>
                  <p
                    className={`${TEXT} mt-3.5 text-xl leading-relaxed sm:text-[21px]`}
                  >
                    {event.description}
                  </p>
                  {quotes.map((memory) => (
                    <figure
                      key={memory.id}
                      className="mt-6 border-l-2 border-(--p-teal) pl-5"
                    >
                      <blockquote
                        className={`${TEXT} text-xl leading-snug italic`}
                      >
                        « {memory.message} »
                      </blockquote>
                      <figcaption className={`${CAPS} mt-2 text-(--p-muted)`}>
                        {memory.name}
                        {memory.year !== null && ` · ${memory.year}`}
                      </figcaption>
                    </figure>
                  ))}
                  {onWriteMemory && (
                    <a
                      href="#memories"
                      onClick={() => onWriteMemory(event.year)}
                      className={`${TEXT} mt-5 inline-block text-lg text-(--p-teal) italic underline-offset-4 hover:underline`}
                    >
                      Vous y étiez ? Signez le livre d’or →
                    </a>
                  )}
                </div>
                {photo && (
                  <figure className="md:col-start-2 lg:col-start-auto">
                    <CloudinaryImage
                      src={photo.image_url}
                      alt={photo.title}
                      width={600}
                      height={450}
                      rounded={RoundedSize.NONE}
                      className="aspect-4/3 w-full object-cover"
                    />
                    <figcaption
                      className={`${TEXT} mt-2 text-base text-(--p-muted) italic`}
                    >
                      {photo.title}
                    </figcaption>
                  </figure>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

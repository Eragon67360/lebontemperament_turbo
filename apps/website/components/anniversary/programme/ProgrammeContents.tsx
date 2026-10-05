import {
  PROGRAMME_ANNIVERSARY_YEAR,
  toRoman,
} from "@/lib/anniversaryProgramme";
import type { NavigationCard } from "@/types/anniversary";
import Image from "next/image";
import Leader from "./Leader";
import Ornament from "./Ornament";
import { PROGRAMME_PARTS, sectionId } from "./sections";
import { CAPS, DISPLAY, PAPER, TEXT } from "./theme";

interface ProgrammeContentsProps {
  cards: NavigationCard[];
  description: string;
}

/**
 * « Au programme »: the table of contents set like a concert programme. One
 * numbered line per navigation card of the CMS, then the anniversary
 * concert; beside it a photo and the CMS introduction.
 */
export default function ProgrammeContents({
  cards,
  description,
}: ProgrammeContentsProps) {
  const entries = [
    ...cards.map((card) => {
      const target = sectionId(card.target_section_id);
      return {
        key: card.id,
        href: `#${target}`,
        title: card.title,
        mark: PROGRAMME_PARTS[target]?.mark,
        sub: card.description,
      };
    }),
    {
      key: "billet",
      href: "#billet",
      title: "Grand concert anniversaire",
      mark: String(PROGRAMME_ANNIVERSARY_YEAR),
      sub: "Le point d’orgue de la saison",
    },
  ];

  return (
    <section
      id="anniversary-navigation"
      className="scroll-mt-20 px-4 pt-16 pb-8 sm:px-6 sm:pt-24 lg:px-8"
    >
      <div
        className={`${PAPER} mx-auto max-w-[1180px] px-6 py-12 sm:px-12 sm:py-16 lg:px-20 lg:pt-[72px]`}
      >
        <Ornament as="h2" className="text-(--p-teal)">
          Au programme
        </Ornament>
        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
          <ol>
            {entries.map((entry, i) => (
              <li key={entry.key}>
                <a
                  href={entry.href}
                  className="group grid grid-cols-[44px_minmax(0,1fr)] gap-4 border-t border-(--p-rule) py-5 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-[22px]"
                >
                  <span
                    className={`${DISPLAY} text-2xl leading-none font-medium text-(--p-teal) sm:text-[26px]`}
                  >
                    {toRoman(i + 1)}
                  </span>
                  <span>
                    <Leader
                      left={
                        <span
                          className={`${TEXT} text-2xl leading-tight transition-colors group-hover:text-(--p-teal) sm:text-[27px]`}
                        >
                          {entry.title}
                        </span>
                      }
                      right={
                        entry.mark && (
                          <span
                            className={`${CAPS} hidden shrink-0 text-(--p-muted) sm:inline`}
                          >
                            {entry.mark}
                          </span>
                        )
                      }
                    />
                    {entry.sub && (
                      <span
                        className={`${TEXT} mt-1.5 block text-lg text-(--p-muted) italic sm:text-[19px]`}
                      >
                        {entry.sub}
                      </span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ol>
          <div>
            <figure>
              <div className="relative aspect-4/5 overflow-hidden">
                <Image
                  src="/img/entre_terre_et_ciel.jpg"
                  alt="Le chœur et l’orchestre en concert dans une cour de pierre"
                  fill
                  sizes="(max-width: 1024px) 100vw, 460px"
                  className="object-cover object-[62%_50%]"
                />
              </div>
              <figcaption
                className={`${TEXT} mt-2.5 text-base text-(--p-muted) italic`}
              >
                Chœur et orchestre réunis en concert.
              </figcaption>
            </figure>
            {description && (
              <p className={`${TEXT} mt-8 text-[22px] leading-normal`}>
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

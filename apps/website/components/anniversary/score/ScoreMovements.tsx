import type { NavigationCard } from "@/types/anniversary";
import ScoreHeading, { SCORE_FONT } from "./ScoreHeading";
import { SECTION_MARKS, sectionId } from "./sections";

interface ScoreMovementsProps {
  cards: NavigationCard[];
}

/**
 * The table of contents, as the movements of the work: one card per
 * navigation card of the CMS, marked with its section's tempo.
 */
export default function ScoreMovements({ cards }: ScoreMovementsProps) {
  if (cards.length === 0) return null;

  return (
    <section
      id="anniversary-navigation"
      className="bg-surface-secondary/40 border-separator text-foreground border-y py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScoreHeading
          kicker="Le programme"
          title="Revoir, réécouter, feuilleter"
          className="mb-10"
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const target = sectionId(card.target_section_id);
            return (
              <li key={card.id}>
                <a
                  href={`#${target}`}
                  className="border-foreground bg-background text-foreground flex h-full flex-col gap-2 rounded-sm border p-6 transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  {SECTION_MARKS[target] && (
                    <span
                      className={`${SCORE_FONT} text-primary-text text-lg italic`}
                    >
                      {SECTION_MARKS[target]}
                    </span>
                  )}
                  <span className={`${SCORE_FONT} text-2xl font-medium`}>
                    {card.title}
                  </span>
                  <span className="text-foreground/85">{card.description}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

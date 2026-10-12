import NextLink from "next/link";
import type { ElementType } from "react";
import {
  IoArrowForwardOutline,
  IoCalendarOutline,
  IoChevronForward,
  IoDocumentTextOutline,
  IoMusicalNotesOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoTicketOutline,
} from "react-icons/io5";

interface Tile {
  href: string;
  title: string;
  icon: ElementType;
  /** The sentence on a computer. */
  description: string;
  /** The shorter line on a phone. */
  shortDescription: string;
  cta: string;
}

const TILES: readonly Tile[] = [
  {
    href: "/membres/travail",
    title: "Mes partitions",
    icon: IoMusicalNotesOutline,
    description:
      "Les partitions et les enregistrements pour travailler chez toi.",
    shortDescription: "Partitions et enregistrements",
    cta: "Ouvrir les partitions",
  },
  {
    href: "/membres/calendrier",
    title: "Les répétitions",
    icon: IoCalendarOutline,
    description:
      "Les dates, les horaires et les adresses, pupitre par pupitre.",
    shortDescription: "Dates, horaires et adresses",
    cta: "Voir le calendrier",
  },
  {
    href: "/membres/concerts",
    title: "Concerts et événements",
    icon: IoTicketOutline,
    description: "Les prochains concerts, les sorties et les ventes.",
    shortDescription: "Ce qui arrive bientôt",
    cta: "Voir ce qui arrive",
  },
  {
    href: "/membres/membres",
    title: "Les membres",
    icon: IoPeopleOutline,
    description: "Retrouver un choriste ou un musicien et lui écrire.",
    shortDescription: "Retrouver quelqu’un, lui écrire",
    cta: "Ouvrir l’annuaire",
  },
  {
    href: "/membres/administration",
    title: "Documents de l’association",
    icon: IoDocumentTextOutline,
    description: "Comptes-rendus du CA, règlement, gazettes et archives.",
    shortDescription: "CA, règlement, gazettes",
    cta: "Voir les documents",
  },
  {
    href: "/membres/mes-donnees",
    title: "Mon compte",
    icon: IoPersonOutline,
    description:
      "Télécharger mes données, demander la suppression de mon compte.",
    shortDescription: "Mes données, suppression du compte",
    cta: "Gérer mon compte",
  },
];

/**
 * « Que veux-tu faire ? »: six big tiles on a computer, a list of rows on a
 * phone.
 */
export function HomeTiles() {
  return (
    <section
      aria-labelledby="home-todo"
      className="flex flex-col gap-4 sm:gap-5"
    >
      <h2
        id="home-todo"
        className="text-foreground text-2xl font-semibold sm:text-3xl"
      >
        Que veux-tu faire ?
      </h2>
      <ul className="border-members-line bg-members-card divide-members-line divide-y overflow-hidden rounded-[20px] border sm:grid sm:grid-cols-2 sm:gap-5 sm:divide-y-0 sm:overflow-visible sm:border-0 sm:bg-transparent lg:grid-cols-3">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <li key={tile.href} className="flex">
              <NextLink
                href={tile.href}
                className="group text-foreground hover:border-primary hover:bg-primary/5 sm:border-members-line sm:bg-members-card flex min-h-[72px] w-full items-center gap-3.5 p-4 no-underline transition-colors sm:min-h-[200px] sm:flex-col sm:items-start sm:gap-3.5 sm:rounded-[20px] sm:border sm:p-7"
              >
                <span
                  aria-hidden="true"
                  className="bg-primary/10 text-primary-text flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] sm:h-14 sm:w-14 sm:rounded-2xl"
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col sm:gap-3.5">
                  <span className="text-[19px] leading-snug font-semibold sm:text-[22px]">
                    {tile.title}
                  </span>
                  <span className="text-muted text-base leading-snug sm:hidden">
                    {tile.shortDescription}
                  </span>
                  <span className="text-muted hidden sm:block">
                    {tile.description}
                  </span>
                </span>
                <span className="text-primary-text hidden items-center gap-2 font-medium sm:inline-flex">
                  {tile.cta}
                  <IoArrowForwardOutline
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>
                <IoChevronForward
                  aria-hidden="true"
                  className="text-primary-text h-[22px] w-[22px] shrink-0 sm:hidden"
                />
              </NextLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

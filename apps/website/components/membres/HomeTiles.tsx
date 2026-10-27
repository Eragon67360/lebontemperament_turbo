import Image from "next/image";
import NextLink from "next/link";
import { IoArrowForwardOutline } from "react-icons/io5";
import { TILE_FILL } from "./tones";

// The fill (background and ink text) comes from TILE_FILL.
const tile =
  "group flex min-h-[220px] flex-col gap-4 rounded-[32px] p-6 no-underline transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 sm:p-7";

function Cta({ children }: { children: string }) {
  return (
    <span className="mt-auto inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-white px-4.5 font-medium">
      {children}
      <IoArrowForwardOutline aria-hidden="true" className="h-5 w-5" />
    </span>
  );
}

/**
 * Three coloured ways in under the home's top blocks: the scores (opening
 * the member's own folder when their voice says which), the concerts, the
 * association's documents.
 */
export function HomeTiles({ scoreFolder }: { scoreFolder: string | null }) {
  const scoresHref = scoreFolder
    ? `/membres/travail?dossier=${encodeURIComponent(scoreFolder)}`
    : "/membres/travail";
  return (
    <ul aria-label="Raccourcis" className="grid gap-4 sm:gap-6 md:grid-cols-3">
      <li className="flex">
        <NextLink
          href={scoresHref}
          className={`${tile} w-full ${TILE_FILL.scores}`}
        >
          <span className="font-medium">Partitions</span>
          <span className="font-members-display text-[28px] leading-[1.1] font-semibold sm:text-[32px]">
            Tes partitions et tes enregistrements
          </span>
          <Cta>Ouvrir</Cta>
        </NextLink>
      </li>
      <li className="flex">
        <NextLink
          href="/membres/concerts"
          className={`${tile} w-full ${TILE_FILL.concerts} p-3.5 sm:p-3.5`}
        >
          <Image
            src="/img/entre_terre_et_ciel.jpg"
            alt=""
            width={720}
            height={480}
            sizes="(min-width: 768px) 360px, 100vw"
            className="aspect-[16/9] w-full rounded-[22px] object-cover"
          />
          <span className="flex flex-1 flex-col gap-3 px-2.5 pb-2.5">
            <span className="font-members-display text-[26px] leading-[1.1] font-semibold">
              Concerts et événements
            </span>
            <Cta>Voir ce qui arrive</Cta>
          </span>
        </NextLink>
      </li>
      <li className="flex">
        <NextLink
          href="/membres/administration"
          className={`${tile} w-full ${TILE_FILL.documents}`}
        >
          <span className="font-medium">Documents</span>
          <span className="font-members-display text-[28px] leading-[1.1] font-semibold sm:text-[32px]">
            Comptes-rendus du CA, règlement, gazettes
          </span>
          <Cta>Voir les documents</Cta>
        </NextLink>
      </li>
    </ul>
  );
}

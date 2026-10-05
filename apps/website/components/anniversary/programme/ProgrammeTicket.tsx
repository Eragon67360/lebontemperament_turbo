import {
  PROGRAMME_ANNIVERSARY_YEAR,
  PROGRAMME_FIRST_YEAR,
} from "@/lib/anniversaryProgramme";
import Link from "next/link";
import { BUTTON_IVORY, CAPS, DISPLAY, TEXT } from "./theme";

const NOTCH =
  "absolute right-[218px] hidden size-6 rounded-full bg-(--p-ivory) md:block";

/**
 * The last page: a ticket for the anniversary concert, with its stub. No
 * date or place is invented: the agenda announces them.
 */
export default function ProgrammeTicket() {
  return (
    <section id="billet" className="scroll-mt-20 px-4 pb-24 sm:px-6 lg:px-8">
      <div className="relative mx-auto grid max-w-[1180px] overflow-hidden rounded-md bg-(--p-deep) text-[#F4EFE4] md:grid-cols-[minmax(0,1fr)_230px]">
        <span aria-hidden="true" className={`${NOTCH} -top-3`} />
        <span aria-hidden="true" className={`${NOTCH} -bottom-3`} />
        <div className="px-7 py-10 sm:px-14 sm:py-12">
          <p className={`${CAPS} text-[#9fd3d0]`}>Grand concert anniversaire</p>
          <h2
            className={`${DISPLAY} mt-3.5 text-[clamp(2.5rem,5vw,3.5rem)] leading-none font-medium`}
          >
            Les quarante ans
          </h2>
          <p className={`${TEXT} mt-3.5 text-[22px] italic opacity-90`}>
            Chœurs et orchestre du Bon Tempérament. La date et le lieu seront
            annoncés dans l’agenda.
          </p>
          <Link href="/concerts" className={`${BUTTON_IVORY} mt-8`}>
            Voir l’agenda des concerts
          </Link>
        </div>
        <div
          aria-hidden="true"
          className="flex flex-row items-center justify-between gap-4 border-t-2 border-dashed border-[#F4EFE4]/45 px-8 py-6 text-center md:flex-col md:border-t-0 md:border-l-2 md:py-12"
        >
          <p className={`${CAPS} opacity-80`}>Entrée · 1 place</p>
          <p
            className={`${DISPLAY} text-6xl leading-none font-extrabold [font-variation-settings:'opsz'_8] md:text-[92px]`}
          >
            40
          </p>
          <p className={`${CAPS} opacity-80`}>
            {PROGRAMME_FIRST_YEAR} — {PROGRAMME_ANNIVERSARY_YEAR}
          </p>
        </div>
      </div>
    </section>
  );
}

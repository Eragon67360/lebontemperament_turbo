import Image from "next/image";
import Leader from "./Leader";
import Ornament from "./Ornament";
import { PAPER, TEXT } from "./theme";

// The ensembles and who leads them, as on /decouvrir.
const CAST = [
  { role: "Direction musicale", name: "Simone Duclos" },
  { role: "Chœur des jeunes", name: "Chloé Rozaire" },
  { role: "Chœur des enfants", name: "Camille Gerlier-Lienhard" },
  { role: "Orchestre (depuis 2023)", name: "Charlotte Lienhard" },
  { role: "Piano", name: "Paul Lienhard" },
];

/** « Distribution »: the cast list of the programme and the whole troupe. */
export default function ProgrammeDistribution() {
  return (
    <section
      id="distribution"
      className="scroll-mt-20 px-4 pt-20 pb-8 sm:px-6 sm:pt-28 lg:px-8"
    >
      <div
        className={`${PAPER} mx-auto max-w-[1180px] px-6 py-12 sm:px-12 sm:py-16 lg:px-20 lg:py-[72px]`}
      >
        <Ornament as="h2" className="text-(--p-teal)">
          Distribution
        </Ornament>
        <ul className={`${TEXT} mt-11 gap-x-[72px] text-xl md:columns-2`}>
          {CAST.map((line) => (
            <li key={line.role} className="break-inside-avoid py-3">
              <Leader
                left={<span>{line.role}</span>}
                right={
                  <span className="text-right text-[22px] tracking-[0.06em] [font-variant:small-caps]">
                    {line.name}
                  </span>
                }
              />
            </li>
          ))}
        </ul>
        <figure className="mt-14">
          <div className="relative aspect-4/3 overflow-hidden sm:aspect-16/7">
            <Image
              src="/img/2023-LeBT.jpeg"
              alt="Les chanteurs du Bon Tempérament, enfants et adultes, bras levés sur les marches d’une église"
              fill
              sizes="(max-width: 1180px) 100vw, 1020px"
              className="object-cover object-[50%_40%]"
            />
          </div>
          <figcaption
            className={`${TEXT} mt-2.5 text-base text-(--p-muted) italic`}
          >
            Toute la troupe, concert Camino Latino à Châteaulin, août 2023.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

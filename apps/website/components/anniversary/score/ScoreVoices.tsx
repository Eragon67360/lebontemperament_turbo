import Fermata from "./Fermata";
import ScoreHeading, { SCORE_FONT } from "./ScoreHeading";

// The ensembles and who leads them, as on /decouvrir.
const VOICES = [
  {
    part: "Chœur d’adultes",
    name: "Simone Duclos",
    role: "fondatrice, cheffe depuis 1987",
  },
  {
    part: "Chœur de jeunes",
    name: "Chloé Rozaire",
    role: "cheffe du chœur de jeunes",
  },
  {
    part: "Chœur des tout-jeunes",
    name: "Camille Gerlier-Lienhard",
    role: "cheffe du chœur d’enfants",
  },
  {
    part: "Orchestre",
    since: "depuis 2023",
    name: "Charlotte Lienhard",
    role: "cheffe de l’orchestre",
  },
  { part: "Piano", name: "Paul Lienhard", role: "accompagnement" },
];

const SMALL_STAFF =
  "bg-[repeating-linear-gradient(to_bottom,currentColor_0,currentColor_1px,transparent_1px,transparent_8px)]";

/** « Tutti »: the parts of the full score, braced, with their conductors. */
export default function ScoreVoices() {
  return (
    <section className="bg-background text-foreground py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScoreHeading
          kicker="Tutti"
          title="Toutes les générations sur la même portée"
          className="mb-10"
        />
        <ul className="before:border-foreground relative pl-7 before:absolute before:top-2 before:bottom-2 before:left-0 before:w-1.5 before:rounded-l-[18px] before:border-[3px] before:border-r-0">
          {VOICES.map((voice) => (
            <li
              key={voice.part}
              className="grid items-center gap-2 py-4 md:grid-cols-[220px_minmax(0,1fr)_240px] md:gap-5"
            >
              <p className={`${SCORE_FONT} text-2xl italic`}>
                {voice.part}
                {voice.since && (
                  <span className="text-muted text-base"> ({voice.since})</span>
                )}
              </p>
              <span
                aria-hidden="true"
                className={`text-foreground hidden h-[33px] md:block ${SMALL_STAFF}`}
              />
              <p className="text-foreground/85">
                <strong className="text-foreground">{voice.name}</strong>
                <br />
                {voice.role}
              </p>
            </li>
          ))}
        </ul>

        <figure className="mx-auto mt-20 max-w-4xl text-center">
          <Fermata className="text-primary mx-auto h-12 w-22" />
          <blockquote
            className={`${SCORE_FONT} mt-4 text-[clamp(1.75rem,3.4vw,2.75rem)] leading-tight font-light italic`}
          >
            « Je vous rappelle que le point d’orgue est au bout du doigt du
            chef. »
          </blockquote>
          <figcaption className="text-muted mt-4">
            Simone Duclos, cheffe principale
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

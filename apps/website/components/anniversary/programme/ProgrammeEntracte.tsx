import Ornament from "./Ornament";
import { BUTTON_LINE, CAPS, TEXT } from "./theme";

/** « Entracte »: the founder's words on deep teal, and the way to the livre d'or. */
export default function ProgrammeEntracte() {
  return (
    <section className="mt-12 bg-(--p-deep) px-6 py-20 text-[#F4EFE4] sm:py-28">
      <figure className="mx-auto max-w-[900px] text-center">
        <Ornament className="text-[#9fd3d0]">Entracte</Ornament>
        <blockquote
          className={`${TEXT} mt-10 text-[clamp(1.75rem,3.4vw,2.75rem)] leading-tight italic`}
        >
          « Je vous rappelle que le point d’orgue est au bout du doigt du chef.
          »
        </blockquote>
        <figcaption className={`${CAPS} mt-6 opacity-80`}>
          Simone Duclos, fondatrice et cheffe
        </figcaption>
      </figure>
      <p className="mt-11 text-center">
        <a href="#memories" className={BUTTON_LINE}>
          Laisser un mot dans le livre d’or
        </a>
      </p>
    </section>
  );
}

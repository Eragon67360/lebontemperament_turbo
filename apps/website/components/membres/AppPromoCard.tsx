import { GOOGLE_PLAY_URL, TESTFLIGHT_URL } from "@/lib/app-links";

const buttonClass =
  "bg-members-ink-foreground text-members-ink inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 text-lg font-medium no-underline hover:opacity-90 sm:w-auto";

/** « Ton pupitre dans ta poche »: the ink strip at the foot of the home. */
export function AppPromoCard() {
  return (
    <section
      aria-labelledby="home-app"
      className="bg-members-ink text-members-ink-foreground flex flex-col gap-5 rounded-[32px] p-6 sm:p-8 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex flex-col gap-1.5">
        <h2
          id="home-app"
          className="font-members-display text-[24px] leading-tight font-semibold sm:text-[28px]"
        >
          Ton pupitre dans ta poche
        </h2>
        <p className="opacity-85">
          Répétitions, partitions et rappels dans l’appli du BT.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={TESTFLIGHT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
        >
          Sur iPhone<span className="sr-only"> (nouvel onglet)</span>
        </a>
        <a
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
        >
          Sur Android<span className="sr-only"> (nouvel onglet)</span>
        </a>
      </div>
    </section>
  );
}

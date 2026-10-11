import { GOOGLE_PLAY_URL, TESTFLIGHT_URL } from "@/lib/app-links";
import { IoPhonePortraitOutline } from "react-icons/io5";

const buttonClass =
  "bg-accent-foreground text-primary-solid inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-lg font-bold no-underline hover:opacity-90 sm:w-auto";

/** « L'appli sur ton téléphone »: the one solid teal card of the home page. */
export function AppPromoCard() {
  return (
    <section
      aria-labelledby="home-app"
      className="bg-primary-solid text-accent-foreground flex flex-col gap-5 rounded-[20px] p-5 sm:p-7 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-start gap-4">
        <IoPhonePortraitOutline
          aria-hidden="true"
          className="mt-1 h-8 w-8 shrink-0"
        />
        <div className="flex flex-col gap-1.5">
          <h2 id="home-app" className="text-[21px] font-extrabold sm:text-2xl">
            L’appli sur ton téléphone
          </h2>
          <p className="opacity-90">
            Répétitions, partitions et rappels, même sans ordinateur.
          </p>
        </div>
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

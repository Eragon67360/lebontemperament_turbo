import { entryFontVariables } from "@/components/anniversary/programme/entryFonts";
import {
  DISPLAY,
  PROGRAMME_TOKENS,
  TEXT,
} from "@/components/anniversary/programme/theme";
import Link from "next/link";

/**
 * The entry points to `/40-ans`, drawn as a page of its programme (direction
 * « Le Programme », owner's choice 2026-10-13): the nav word in Bodoni italic,
 * a paper card on the home hero, a paper row in the phone menu. Callers show
 * them only when the anniversary flag is on, or to admins.
 */

const HREF = "/40-ans";
const YEARS = "1987 — 2027";

/** The desktop nav item, next to the other words of `MainLinks`. */
export function AnniversaryNavLink({
  isLight,
  isActive,
}: {
  /** Over the home photo, before scrolling: ivory instead of ink. */
  isLight?: boolean;
  isActive: boolean;
}) {
  return (
    <Link
      href={HREF}
      aria-current={isActive ? "page" : undefined}
      className={`${entryFontVariables} ${PROGRAMME_TOKENS} ${DISPLAY} border-y-2 px-2 py-1 text-[21px] leading-[1.15] font-medium tracking-normal normal-case italic transition-all duration-300 ${
        isLight ? "text-[#F4EFE4]" : "text-(--p-deep) dark:text-(--p-ink)"
      } ${
        isActive
          ? "border-primary/65 dark:border-primary/80"
          : "hover:border-primary/65 dark:hover:border-primary/80 border-transparent"
      }`}
    >
      40 ans
    </Link>
  );
}

/** The last row of the phone menu (`MainMenuLinks`). */
export function AnniversaryMenuLink({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={HREF}
      onClick={onNavigate}
      className={`${entryFontVariables} ${PROGRAMME_TOKENS} mt-4 block bg-(--p-paper) p-1.5 text-(--p-ink) transition-colors`}
    >
      <span className="flex items-center justify-between gap-4 border border-(--p-rule) px-4 py-3">
        <span className="flex flex-col gap-0.5">
          <span
            className={`${DISPLAY} text-2xl leading-tight font-medium text-(--p-deep) italic dark:text-(--p-ink)`}
          >
            40 ans
          </span>
          <span className={`${TEXT} text-[15px] text-(--p-muted)`}>
            {YEARS} · le programme
          </span>
        </span>
        <ArrowIcon className="h-5 w-5 shrink-0 text-(--p-teal)" />
      </span>
    </Link>
  );
}

/**
 * The home hero's card. `corner`: the desktop card in the hero's bottom-left
 * corner (it scrolls and fades with the hero, unlike the former floating
 * bubble); `inline`: the phone and tablet ticket under the hero buttons. The
 * paper stays light in both themes: it sits on the dark photo.
 */
export function AnniversaryHeroCard({
  variant,
  className = "",
}: {
  variant: "corner" | "inline";
  className?: string;
}) {
  const label = `Les 40 ans du Bon Tempérament, ${YEARS} : feuilleter le programme`;

  if (variant === "inline") {
    return (
      <Link
        href={HREF}
        aria-label={label}
        className={`${entryFontVariables} block w-full max-w-[19rem] bg-[#FBF8F1] p-1.5 text-left text-[#1D1F1F] transition-colors hover:bg-white ${className}`}
      >
        <span className="flex items-center gap-3.5 border border-[#CFC6B4] px-3.5 py-3">
          <span
            className={`${DISPLAY} text-[44px] leading-none font-medium text-[#0D3B3E]`}
          >
            40
          </span>
          <span aria-hidden className="w-px self-stretch bg-[#CFC6B4]" />
          <span className="flex flex-col gap-0.5">
            <span className={`${TEXT} text-[15px] text-[#5E6462]`}>
              <span className="text-[#0D3B3E] italic">saisons</span> · {YEARS}
            </span>
            <span
              className={`${TEXT} text-base font-medium whitespace-nowrap text-[#156C71]`}
            >
              Feuilleter le programme <span aria-hidden>→</span>
            </span>
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={HREF}
      aria-label={label}
      className={`${entryFontVariables} block w-66 bg-[#FBF8F1] p-1.5 text-[#1D1F1F] transition-colors hover:bg-white ${className}`}
    >
      <span className="flex flex-col items-center border border-[#CFC6B4] px-4.5 pt-4 pb-3.5 text-center">
        <span className="flex items-center gap-2 text-[10.5px] font-medium tracking-[0.2em] whitespace-nowrap text-[#5E6462] uppercase before:h-px before:w-4 before:bg-[#CFC6B4] after:h-px after:w-4 after:bg-[#CFC6B4]">
          Le Bon Tempérament
        </span>
        <span className="mt-1.5 flex items-baseline gap-2">
          <span
            className={`${DISPLAY} text-[62px] leading-none font-medium text-[#0D3B3E]`}
          >
            40
          </span>
          <span className={`${TEXT} text-2xl text-[#0D3B3E] italic`}>
            saisons
          </span>
        </span>
        <span
          className={`${TEXT} mt-1 text-base tracking-[0.04em] text-[#5E6462]`}
        >
          {YEARS}
        </span>
        <span aria-hidden className="mt-3 mb-2.5 h-px w-full bg-[#CFC6B4]" />
        <span className={`${TEXT} text-[17px] font-medium text-[#156C71]`}>
          Feuilleter le programme <span aria-hidden>→</span>
        </span>
      </span>
    </Link>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

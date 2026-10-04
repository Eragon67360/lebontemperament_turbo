import type { ReactNode } from "react";

/**
 * The display face of the anniversary score (Fraunces), loaded by
 * `app/40-ans/page.tsx` as `--font-score` for this page only.
 */
export const SCORE_FONT = "font-(family-name:--font-score)";

interface ScoreHeadingProps {
  /** The musical mark above the title: « Prélude », « I · Allegro », « Coda ». */
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
}

/** Section heading of the /40-ans score: italic mark, serif title, intro. */
export default function ScoreHeading({
  kicker,
  title,
  intro,
  className = "",
}: ScoreHeadingProps) {
  return (
    <div className={`max-w-3xl ${className}`}>
      <p
        className={`${SCORE_FONT} text-primary-text mb-2 text-lg italic sm:text-xl`}
      >
        {kicker}
      </p>
      <h2
        className={`${SCORE_FONT} text-foreground text-4xl leading-[1.05] font-normal tracking-tight sm:text-5xl`}
      >
        {title}
      </h2>
      {intro && (
        <p className="text-muted mt-4 text-lg leading-relaxed">{intro}</p>
      )}
    </div>
  );
}

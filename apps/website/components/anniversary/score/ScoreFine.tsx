import { SCORE_FIRST_YEAR } from "@/lib/anniversaryScore";
import { SCORE_FONT } from "./ScoreHeading";

/** The last bar of the page: « Fine » and a final double bar line. */
export default function ScoreFine() {
  return (
    <div className="border-foreground bg-background text-foreground border-t py-12">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <p className={`${SCORE_FONT} text-5xl font-light italic`}>Fine</p>
        <span aria-hidden="true" className="flex h-16 gap-1.5">
          <span className="bg-foreground w-0.5" />
          <span className="bg-foreground w-2" />
        </span>
        <p className="text-muted">
          Le Bon Tempérament · chœurs et orchestre · Saverne, depuis{" "}
          {SCORE_FIRST_YEAR}
        </p>
      </div>
    </div>
  );
}

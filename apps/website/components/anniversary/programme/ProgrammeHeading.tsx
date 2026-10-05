import type { ReactNode } from "react";
import { CAPS, DISPLAY, TEXT } from "./theme";

interface ProgrammeHeadingProps {
  /** The part above the title: « Première partie », « Livre d’or ». */
  part: string;
  title: ReactNode;
  intro?: ReactNode;
  /** `sm` inside a page of the booklet, beside other content. */
  size?: "lg" | "sm";
  className?: string;
}

/** Section heading of the /40-ans programme: part, Bodoni title, intro. */
export default function ProgrammeHeading({
  part,
  title,
  intro,
  size = "lg",
  className = "",
}: ProgrammeHeadingProps) {
  return (
    <div className={`max-w-3xl ${className}`}>
      <p className={`${CAPS} text-(--p-teal)`}>{part}</p>
      <h2
        className={`${DISPLAY} mt-3 leading-none ${size === "lg" ? "text-[clamp(2.5rem,5vw,4.5rem)]" : "text-[clamp(2.25rem,3.6vw,3.25rem)]"} font-normal tracking-[-0.02em]`}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={`${TEXT} mt-4 max-w-2xl text-xl leading-normal text-(--p-muted) italic sm:text-[21px]`}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

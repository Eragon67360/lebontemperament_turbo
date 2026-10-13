import type { VoiceKey } from "@/lib/membres/voices";
import { VOICE_HEX } from "./tones";

type Seat = { left: number; top: number; voice: VoiceKey };

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * The choir's seating plan as rows of dots: the orchestra in front, then
 * the sopranos, altos, tenors and basses from left to right. A drawing only
 * (`aria-hidden`): the voices it shows are always named next to it.
 */
function seatsFor(rows: number, firstRow: number, perRow: number): Seat[] {
  const seats: Seat[] = [];
  for (let r = 0; r < rows; r++) {
    // Radius as a share of the half-width, the innermost row first.
    const radius = 0.38 + (0.6 * r) / (rows - 1);
    const count = firstRow + r * perRow;
    for (let i = 0; i < count; i++) {
      const f = i / (count - 1);
      const angle = Math.PI * (1 - f);
      let voice: VoiceKey;
      if (r < 2) voice = "orchestre";
      else if (f < 0.27) voice = "soprane";
      else if (f < 0.52) voice = "alte";
      else if (f < 0.76) voice = "tenor";
      else voice = "basse";
      seats.push({
        // Percentages of the box: x across the width, y down the height
        // (the box is twice as wide as it is high, plus the dots' margin).
        // Rounded: the server's and the browser's sines can differ in the
        // last digits, which React reports as a hydration mismatch.
        left: round(50 + 47 * radius * Math.cos(angle)),
        top: round(94 - 88 * radius * Math.sin(angle)),
        voice,
      });
    }
  }
  return seats;
}

const LARGE = seatsFor(6, 9, 4);
const SMALL = seatsFor(5, 8, 3);

export function ChoirArc({
  mine = null,
  only = null,
  onColor = false,
  size = "large",
  conductor = false,
  className = "",
}: {
  /** The member's own section, drawn in ink. */
  mine?: VoiceKey | null;
  /** A chosen section: the others become empty rings. */
  only?: VoiceKey | null;
  /** On a voice-coloured block: the orchestra turns white. */
  onColor?: boolean;
  size?: "large" | "small";
  /** Writes « Direction » where the conductor stands. */
  conductor?: boolean;
  className?: string;
}) {
  const seats = size === "large" ? LARGE : SMALL;
  const dot = size === "large" ? "h-[3.4%] min-h-2" : "h-[3.6%] min-h-1.5";
  return (
    <div
      aria-hidden="true"
      className={`relative aspect-[2/1.08] w-full ${className}`}
    >
      {seats.map((seat, index) => {
        const isMine = mine !== null && seat.voice === mine;
        const shown = only === null || seat.voice === only;
        let color = VOICE_HEX[seat.voice];
        if (onColor && seat.voice === "orchestre") color = "#ffffff";
        if (isMine) color = "#17171c";
        return (
          <span
            key={index}
            className={`absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 ${dot} ${
              onColor ? "" : "ring-members-ink/80 ring-[1.5px]"
            }`}
            style={{
              left: `${seat.left}%`,
              top: `${seat.top}%`,
              backgroundColor: shown ? color : "transparent",
            }}
          />
        );
      })}
      {conductor && (
        <span className="absolute top-[92%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-medium sm:text-base">
          Direction
        </span>
      )}
    </div>
  );
}

import type { ReactNode } from "react";

/** A programme line: left text, dotted leader, right text. */
export default function Leader({
  left,
  right,
  className = "",
}: {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}) {
  return (
    <span className={`flex items-baseline gap-2.5 ${className}`}>
      {left}
      <span
        aria-hidden="true"
        className="min-w-6 flex-1 -translate-y-1.5 border-b-[1.5px] border-dotted border-[#9c9483]"
      />
      {right}
    </span>
  );
}

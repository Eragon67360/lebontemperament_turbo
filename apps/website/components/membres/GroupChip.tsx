import type { GroupType } from "@repo/domain/types/rehearsals";
import { GROUP_LABEL, GROUP_TONE, TONES } from "./tones";

/** A rehearsal group as a coloured pill that always says its name. */
export function GroupChip({
  group,
  className = "",
}: {
  group: GroupType;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full px-3.5 py-1 text-base leading-snug font-medium ${TONES[GROUP_TONE[group]]} ${className}`}
    >
      {GROUP_LABEL[group] ?? group}
    </span>
  );
}

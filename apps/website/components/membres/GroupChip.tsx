import type { GroupType } from "@repo/domain/types/rehearsals";
import { GROUP_LABEL, GROUP_TONE, TONES } from "./tones";

/** A rehearsal group as a coloured chip that always says its name. */
export function GroupChip({
  group,
  className = "",
}: {
  group: GroupType;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-lg px-3 py-1 text-base leading-snug font-medium ${TONES[GROUP_TONE[group]]} ${className}`}
    >
      {GROUP_LABEL[group] ?? group}
    </span>
  );
}

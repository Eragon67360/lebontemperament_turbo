import { StatusBadge } from "@/components/ui/status-badge";
import type { User } from "@/types/user";
import {
  memberStatus,
  STATUS_LABELS,
  STATUS_TONES,
  type RosterFlag,
} from "@/utils/members/list";
import { TriangleAlert } from "lucide-react";

/**
 * « Actif » / « Invitation envoyée », then what the roster review says:
 * « Diffère de la liste » or « Absent de la liste » (both lead to the member
 * page, which explains and offers the fix).
 */
export function MemberStatus({
  user,
  flag,
}: {
  user: Pick<User, "invite_status">;
  flag?: RosterFlag;
}) {
  const status = memberStatus(user);
  return (
    <span className="flex flex-wrap gap-1.5">
      <StatusBadge tone={STATUS_TONES[status]}>
        {STATUS_LABELS[status]}
      </StatusBadge>
      {flag?.absent && (
        <StatusBadge tone="warning" dot={false}>
          <TriangleAlert aria-hidden />
          Absent de la liste
        </StatusBadge>
      )}
      {flag && flag.changes.length > 0 && (
        <StatusBadge tone="warning" dot={false}>
          <TriangleAlert aria-hidden />
          Diffère de la liste
        </StatusBadge>
      )}
    </span>
  );
}

/** The member’s voices as neutral chips; « — » when the roster gives none. */
export function VoiceChips({ voices }: { voices: string[] }) {
  if (voices.length === 0) {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden>—</span>
        <span className="sr-only">Aucune voix</span>
      </span>
    );
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {voices.map((voice) => (
        <StatusBadge key={voice} tone="neutral" dot={false}>
          {voice}
        </StatusBadge>
      ))}
    </span>
  );
}

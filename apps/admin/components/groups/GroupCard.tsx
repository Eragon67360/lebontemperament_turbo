import { GroupTile } from "@/components/groups/GroupIcon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { MemberAvatar } from "@/components/users/MemberAvatar";
import type { GroupPerson, GroupSummary } from "@/utils/groups/types";
import { managersLine } from "@/utils/groups/view";
import RouteNames from "@/utils/routes";
import { eventPeriodLabel } from "@/utils/season/schedule";
import {
  GROUP_KIND_LABELS,
  GROUP_VISIBILITY_LABELS,
  groupMemberCountLabel,
} from "@repo/domain/utils/memberGroups";
import { ArrowRight, CalendarDays, Lock } from "lucide-react";
import Link from "next/link";

/** Up to five faces, overlapping, then « +6 ». Decorative: the count is written beside. */
export function AvatarStack({
  people,
  total,
}: {
  people: readonly GroupPerson[];
  total: number;
}) {
  if (people.length === 0) return null;
  const more = total - people.length;
  return (
    <span aria-hidden className="flex items-center">
      {people.map((person) => (
        <MemberAvatar
          key={person.id}
          user={{
            avatar: person.avatar ?? undefined,
            display_name: person.name,
            email: person.email ?? "",
          }}
          className="ring-card -ml-2 size-8 text-[12px] ring-2 first:ml-0"
        />
      ))}
      {more > 0 && (
        <span className="bg-muted text-note ring-card -ml-2 grid size-8 place-content-center rounded-full font-medium ring-2">
          +{more}
        </span>
      )}
    </span>
  );
}

/**
 * One group of « Groupes »: its tile, name, type and visibility, what it is
 * for, who is in it (faces, count, « Responsable ») and its next event, then
 * « Ouvrir le groupe ».
 */
export function GroupCard({ group }: { group: GroupSummary }) {
  const managers = managersLine(group.managers);
  const count = group.member_ids.length;
  return (
    <Card className="flex h-full flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <GroupTile icon={group.icon} color={group.color} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="text-body font-semibold break-words">{group.name}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge tone="accent" dot={false}>
              {GROUP_KIND_LABELS[group.kind]}
            </StatusBadge>
            {group.visibility === "private" ? (
              <StatusBadge tone="neutral" dot={false}>
                <Lock aria-hidden />
                {GROUP_VISIBILITY_LABELS.private}
              </StatusBadge>
            ) : (
              <StatusBadge tone="info" dot={false}>
                {GROUP_VISIBILITY_LABELS.members}
              </StatusBadge>
            )}
            {group.archived_at && (
              <StatusBadge tone="warning">Archivé</StatusBadge>
            )}
          </div>
        </div>
      </div>

      {group.description && (
        <p className="text-detail text-muted-foreground line-clamp-2 break-words">
          {group.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <AvatarStack people={group.preview} total={count} />
        <span className="text-detail font-medium">
          {groupMemberCountLabel(count)}
        </span>
      </div>
      {managers && (
        <p className="text-note text-muted-foreground -mt-2 truncate">
          {managers}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-3">
        <p className="text-note text-muted-foreground flex min-w-0 items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden />
          {group.next_event ? (
            <span className="truncate">
              Prochain : {group.next_event.title} ·{" "}
              {eventPeriodLabel(group.next_event)}
            </span>
          ) : (
            <span>Aucun événement prévu</span>
          )}
        </p>
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link href={RouteNames.DASHBOARD.ADMIN.GROUP(group.id)}>
            Ouvrir le groupe
            <span className="sr-only"> « {group.name} »</span>
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { AnniversaryIcon } from "@/components/anniversary/AnniversaryIcon";
import {
  ContentRow,
  Fact,
  type ReorderControls,
} from "@/components/anniversary/ContentRow";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AnniversaryTimelineEvent } from "@/types/anniversary";
import { iconLabel } from "@/utils/anniversary/icons";

export function TimelineEventItem({
  event,
  reorder,
  busy,
  onEdit,
  onToggleVisibility,
  onDelete,
}: {
  event: AnniversaryTimelineEvent;
  reorder: ReorderControls;
  busy: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  return (
    <ContentRow
      name={`${event.title} (${event.year})`}
      title={event.title}
      leading={
        <div className="bg-primary-soft text-primary-text flex h-12 min-w-12 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5">
          <span className="text-detail font-semibold tabular-nums">
            {event.year || "—"}
          </span>
          <AnniversaryIcon name={event.icon_name} className="size-4" />
        </div>
      }
      description={event.description}
      badges={
        !event.year && <StatusBadge tone="warning">Sans année</StatusBadge>
      }
      meta={<Fact>Icône : {iconLabel(event.icon_name)}</Fact>}
      visible={event.is_visible}
      reorder={reorder}
      busy={busy}
      onEdit={onEdit}
      onToggleVisibility={onToggleVisibility}
      onDelete={onDelete}
    />
  );
}

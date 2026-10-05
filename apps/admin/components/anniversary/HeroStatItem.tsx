"use client";

import { AnniversaryIcon } from "@/components/anniversary/AnniversaryIcon";
import {
  ContentRow,
  Fact,
  IconTile,
  type ReorderControls,
} from "@/components/anniversary/ContentRow";
import type { AnniversaryHeroStat } from "@/types/anniversary";
import { iconLabel } from "@/utils/anniversary/icons";

export function HeroStatItem({
  stat,
  reorder,
  busy,
  onEdit,
  onToggleVisibility,
  onDelete,
}: {
  stat: AnniversaryHeroStat;
  reorder: ReorderControls;
  busy: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  return (
    <ContentRow
      name={`${stat.number} ${stat.label}`}
      title={
        <>
          <span className="text-section">{stat.number}</span>{" "}
          <span className="text-muted-foreground font-medium">
            {stat.label}
          </span>
        </>
      }
      leading={
        <IconTile>
          <AnniversaryIcon name={stat.icon_name} className="size-6" />
        </IconTile>
      }
      meta={<Fact>Icône : {iconLabel(stat.icon_name)}</Fact>}
      visible={stat.is_visible}
      reorder={reorder}
      busy={busy}
      onEdit={onEdit}
      onToggleVisibility={onToggleVisibility}
      onDelete={onDelete}
    />
  );
}

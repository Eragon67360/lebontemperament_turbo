"use client";

import { AnniversaryIcon } from "@/components/anniversary/AnniversaryIcon";
import {
  ContentRow,
  Fact,
  IconTile,
  type ReorderControls,
} from "@/components/anniversary/ContentRow";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AnniversaryNavigationCard } from "@/types/anniversary";
import { isPageSectionId, sectionLabel } from "@/utils/anniversary/sections";
import { ArrowRight } from "lucide-react";

export function NavigationCardItem({
  card,
  reorder,
  busy,
  onEdit,
  onToggleVisibility,
  onDelete,
}: {
  card: AnniversaryNavigationCard;
  reorder: ReorderControls;
  busy: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  const known = isPageSectionId(card.target_section_id);
  return (
    <ContentRow
      name={card.title}
      title={card.title}
      leading={
        <IconTile>
          <AnniversaryIcon name={card.icon_name} className="size-6" />
        </IconTile>
      }
      description={card.description}
      badges={
        !known && <StatusBadge tone="warning">Section inconnue</StatusBadge>
      }
      meta={
        <Fact icon={ArrowRight}>
          Mène à :{" "}
          {known
            ? sectionLabel(card.target_section_id)
            : `« ${card.target_section_id} » (à corriger)`}
        </Fact>
      }
      visible={card.is_visible}
      reorder={reorder}
      busy={busy}
      onEdit={onEdit}
      onToggleVisibility={onToggleVisibility}
      onDelete={onDelete}
    />
  );
}

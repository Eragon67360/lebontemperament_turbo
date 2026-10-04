"use client";

import type { ReorderControls } from "@/components/anniversary/ContentRow";
import {
  SortableList,
  SortableRow,
} from "@/components/anniversary/SortableList";
import { useAnniversaryReorder } from "@/hooks/useAnniversaryReorder";
import { sortByOrder, type Orderable } from "@/utils/anniversary/reorder";
import type { QueryKey } from "@tanstack/react-query";
import * as React from "react";

/**
 * A list ordered by `display_order`, with a drag handle and « Monter /
 * Descendre » on every row, saved through the list's `PATCH` endpoint.
 * `renderItem` receives the row's reorder controls to hand to `ContentRow`.
 */
export function CampaignList<T extends Orderable>({
  items,
  endpoint,
  queryKey,
  nameOf,
  renderItem,
  className = "space-y-3",
}: {
  items: readonly T[];
  endpoint: string;
  queryKey: QueryKey;
  nameOf: (item: T) => string;
  renderItem: (item: T, reorder: ReorderControls) => React.ReactNode;
  className?: string;
}) {
  const ordered = React.useMemo(() => sortByOrder(items), [items]);
  const reorder = useAnniversaryReorder({
    items: ordered,
    endpoint,
    queryKey,
    nameOf,
  });

  return (
    <SortableList
      ids={ordered.map((item) => item.id)}
      onReorder={reorder.drag}
      disabled={reorder.isPending}
      className={className}
    >
      {ordered.map((item, index) => (
        <SortableRow key={item.id} id={item.id}>
          {renderItem(item, {
            canMoveUp: index > 0,
            canMoveDown: index < ordered.length - 1,
            onMoveUp: () => reorder.move(item.id, "up"),
            onMoveDown: () => reorder.move(item.id, "down"),
            disabled: reorder.isPending,
          })}
        </SortableRow>
      ))}
    </SortableList>
  );
}

/** The same controls for a grid (photos), without the drag handle. */
export function useGridReorder<T extends Orderable>({
  items,
  endpoint,
  queryKey,
  nameOf,
}: {
  items: readonly T[];
  endpoint: string;
  queryKey: QueryKey;
  nameOf: (item: T) => string;
}) {
  const ordered = React.useMemo(() => sortByOrder(items), [items]);
  const reorder = useAnniversaryReorder({
    items: ordered,
    endpoint,
    queryKey,
    nameOf,
  });
  const controlsFor = (item: T, index: number): ReorderControls => ({
    canMoveUp: index > 0,
    canMoveDown: index < ordered.length - 1,
    onMoveUp: () => reorder.move(item.id, "up"),
    onMoveDown: () => reorder.move(item.id, "down"),
    disabled: reorder.isPending,
  });
  return { ordered, controlsFor };
}

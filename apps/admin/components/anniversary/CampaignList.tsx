"use client";

import type { ReorderControls } from "@/components/anniversary/ContentRow";
import {
  SortableList,
  SortableRow,
} from "@/components/anniversary/SortableList";
import {
  patchOrderWriter,
  useReorder,
  type OrderWriter,
} from "@/hooks/useReorder";
import { sortByOrder, type Orderable } from "@/utils/anniversary/reorder";
import type { QueryKey } from "@tanstack/react-query";
import * as React from "react";

type ListWriter =
  /** The list's `PATCH` endpoint taking `{ id, display_order }`. */
  | { endpoint: string; write?: never }
  /** Or the list's own way of writing one row's order (projects: `PUT /api/projects/[id]`). */
  | { write: OrderWriter; endpoint?: never };

/**
 * A list ordered by `display_order`, with a drag handle and « Monter /
 * Descendre » on every row, saved through the list's `PATCH` endpoint (or
 * its own `write`). `renderItem` receives the row's reorder controls to
 * hand to `ContentRow`.
 */
export function CampaignList<T extends Orderable>({
  items,
  endpoint,
  write,
  queryKey,
  nameOf,
  renderItem,
  className = "space-y-3",
}: {
  items: readonly T[];
  queryKey: QueryKey;
  nameOf: (item: T) => string;
  renderItem: (item: T, reorder: ReorderControls) => React.ReactNode;
  className?: string;
} & ListWriter) {
  const ordered = React.useMemo(() => sortByOrder(items), [items]);
  const writer = React.useMemo(
    () => write ?? patchOrderWriter(endpoint!),
    [write, endpoint],
  );
  const reorder = useReorder({
    items: ordered,
    write: writer,
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
  const write = React.useMemo(() => patchOrderWriter(endpoint), [endpoint]);
  const reorder = useReorder({ items: ordered, write, queryKey, nameOf });
  const controlsFor = (item: T, index: number): ReorderControls => ({
    canMoveUp: index > 0,
    canMoveDown: index < ordered.length - 1,
    onMoveUp: () => reorder.move(item.id, "up"),
    onMoveDown: () => reorder.move(item.id, "down"),
    disabled: reorder.isPending,
  });
  return { ordered, controlsFor };
}

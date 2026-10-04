"use client";

import {
  applyUpdates,
  planDrag,
  planMove,
  type Direction,
  type Orderable,
  type OrderUpdate,
} from "@/utils/anniversary/reorder";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

/** Writes one row's new `display_order` through the list's own endpoint. */
export type OrderWriter = (update: OrderUpdate) => Promise<void>;

/** The common shape: `PATCH endpoint` with `{ id, display_order }`. */
export function patchOrderWriter(endpoint: string): OrderWriter {
  return async (update) => {
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  };
}

/**
 * « Monter / Descendre » and drag reorders for a list sorted by
 * `display_order`. Each changed row goes through `write` (one request per
 * row: the APIs have no batch); the cache shows the new order at once.
 * When some rows fail, the toast names them and the list is refetched so
 * what is shown is what is stored.
 */
export function useReorder<T extends Orderable>({
  items,
  write,
  queryKey,
  nameOf,
}: {
  items: readonly T[];
  write: OrderWriter;
  queryKey: QueryKey;
  nameOf: (item: T) => string;
}) {
  const queryClient = useQueryClient();
  const [isPending, setPending] = useState(false);

  const save = useCallback(
    async (updates: OrderUpdate[]) => {
      if (updates.length === 0) return;
      setPending(true);
      queryClient.setQueryData<T[]>(queryKey, (current) =>
        applyUpdates(current ?? items, updates),
      );
      const results = await Promise.allSettled(updates.map(write));
      const failed = results
        .map((result, index) => (result.status === "rejected" ? index : -1))
        .filter((index) => index >= 0)
        .map((index) => {
          const item = items.find((it) => it.id === updates[index]!.id);
          return item ? nameOf(item) : updates[index]!.id;
        });
      if (failed.length > 0) {
        toast.error("L'ordre n'a pas pu être enregistré pour tout", {
          description: `Non enregistré : ${failed.map((name) => `« ${name} »`).join(", ")}. La liste a été rechargée.`,
        });
      }
      await queryClient.invalidateQueries({ queryKey });
      setPending(false);
    },
    [items, nameOf, queryClient, queryKey, write],
  );

  const move = useCallback(
    (id: string, direction: Direction) =>
      save(planMove(items, id, direction).updates),
    [items, save],
  );

  const drag = useCallback(
    (activeId: string, overId: string) =>
      save(planDrag(items, activeId, overId).updates),
    [items, save],
  );

  return { move, drag, isPending };
}

"use client";

import { patchOrderWriter, useReorder } from "@/hooks/useReorder";
import type { Orderable } from "@/utils/anniversary/reorder";
import type { QueryKey } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * « Monter / Descendre » and drag reorders for one anniversary list: the
 * generic `useReorder` writing `{ id, display_order }` through the list's
 * existing `PATCH` endpoint.
 */
export function useAnniversaryReorder<T extends Orderable>({
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
  const write = useMemo(() => patchOrderWriter(endpoint), [endpoint]);
  return useReorder({ items, write, queryKey, nameOf });
}

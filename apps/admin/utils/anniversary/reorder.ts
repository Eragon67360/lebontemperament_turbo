// Pure planning of « Monter / Descendre » and drag reorders over lists
// sorted by `display_order`. The admin's lists come from the API already
// sorted, but their orders may hold gaps or duplicates (orders used to be
// typed by hand): a move therefore renumbers 1..n and only sends the rows
// whose number actually changes, through the existing update endpoints.
//
// `descending` is for lists the website shows highest order first (the
// concert stories): the first row then gets n and the last 1.

export type Orderable = { id: string; display_order: number };

export type OrderUpdate = { id: string; display_order: number };

export type Direction = "up" | "down";

/** The list sorted by display order, ties broken by the current position. */
export function sortByOrder<T extends Orderable>(
  items: readonly T[],
  descending = false,
): T[] {
  const sign = descending ? -1 : 1;
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        sign * (a.item.display_order - b.item.display_order) ||
        a.index - b.index,
    )
    .map(({ item }) => item);
}

/** The updates that give `ordered` the numbers 1..n (n..1 when descending); rows already right are omitted. */
export function renumber<T extends Orderable>(
  ordered: readonly T[],
  descending = false,
): OrderUpdate[] {
  return ordered
    .map((item, index) => ({
      id: item.id,
      display_order: descending ? ordered.length - index : index + 1,
    }))
    .filter(
      (update, index) => ordered[index]!.display_order !== update.display_order,
    );
}

/** The list with the item at `from` moved to `to`. */
export function moveIndex<T>(
  items: readonly T[],
  from: number,
  to: number,
): T[] {
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

/**
 * Plans one step up or down for `id`: the resulting list (for an optimistic
 * display) and the rows to send. An item already at the edge yields no
 * change; an unknown id yields no change either.
 */
export function planMove<T extends Orderable>(
  items: readonly T[],
  id: string,
  direction: Direction,
  descending = false,
): { ordered: T[]; updates: OrderUpdate[] } {
  const ordered = sortByOrder(items, descending);
  const from = ordered.findIndex((item) => item.id === id);
  if (from === -1) return { ordered, updates: [] };
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= ordered.length) return { ordered, updates: [] };
  const moved = moveIndex(ordered, from, to);
  return { ordered: moved, updates: renumber(moved, descending) };
}

/** Plans a drag of `activeId` onto `overId`'s position. */
export function planDrag<T extends Orderable>(
  items: readonly T[],
  activeId: string,
  overId: string,
  descending = false,
): { ordered: T[]; updates: OrderUpdate[] } {
  const ordered = sortByOrder(items, descending);
  const from = ordered.findIndex((item) => item.id === activeId);
  const to = ordered.findIndex((item) => item.id === overId);
  if (from === -1 || to === -1 || from === to) return { ordered, updates: [] };
  const moved = moveIndex(ordered, from, to);
  return { ordered: moved, updates: renumber(moved, descending) };
}

/** The display order a new item gets: after the last one (first when descending). */
export function nextOrder(items: readonly Orderable[]): number {
  return items.reduce((max, item) => Math.max(max, item.display_order), 0) + 1;
}

/** Applies a partial list of updates to the items, for an optimistic cache. */
export function applyUpdates<T extends Orderable>(
  items: readonly T[],
  updates: readonly OrderUpdate[],
  descending = false,
): T[] {
  const byId = new Map(updates.map((update) => [update.id, update]));
  return sortByOrder(
    items.map((item) => {
      const update = byId.get(item.id);
      return update ? { ...item, display_order: update.display_order } : item;
    }),
    descending,
  );
}

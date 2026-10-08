// « Rejoindre et FAQ » (public.faq_items and public.joining_slots, edited in
// the admin). Same limits as the tables' CHECK constraints
// (supabase/migrations/20261009020100_faq_and_joining.sql).
export { ANNOUNCEMENT_LINK_PATTERN as SITE_LINK_PATTERN } from "./announcements";

export const FAQ_QUESTION_MAX = 200;
export const FAQ_ANSWER_MAX = 1500;
export const FAQ_LINK_MAX = 500;
export const FAQ_LINK_LABEL_MAX = 60;

export const SLOT_GROUP_MAX = 80;
export const SLOT_DAY_MAX = 40;
export const SLOT_TIME_MAX = 40;
export const SLOT_PLACE_MAX = 120;
export const SLOT_RHYTHM_MAX = 120;

/**
 * The sort orders after moving `id` one step up or down in `items` (sorted
 * ascending): the two rows to update, or [] at either end. Equal sort orders
 * (rows added at the same place) are first spread out in tens.
 */
export function moveSortOrders(
  items: readonly { id: string; sort_order: number }[],
  id: string,
  direction: "up" | "down",
): { id: string; sort_order: number }[] {
  const index = items.findIndex((item) => item.id === id);
  const other = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || other < 0 || other >= items.length) return [];

  const distinct =
    new Set(items.map((item) => item.sort_order)).size === items.length;
  const orders = distinct
    ? items.map((item) => item.sort_order)
    : items.map((_, i) => (i + 1) * 10);
  const swapped = [...orders];
  swapped[index] = orders[other]!;
  swapped[other] = orders[index]!;

  return items
    .map((item, i) => ({ id: item.id, sort_order: swapped[i]! }))
    .filter((item, i) => item.sort_order !== items[i]!.sort_order);
}

/** The next sort order, to add a row at the end. */
export function nextSortOrder(
  items: readonly { sort_order: number }[],
): number {
  return items.reduce((max, item) => Math.max(max, item.sort_order), 0) + 10;
}

// « Commandes »: what the pages compute from a sale (rows of buyers, the
// search and filters, the sentences, the export's file name). Pure and
// unit-tested (view.test.ts); the totals themselves come from
// @repo/domain/utils/orders and are never recomputed here.
import type { StatusTone } from "@/components/ui/status-badge";
import type { SaleDetail, SaleOrder } from "@/utils/orders/types";
import {
  type BalanceStatus,
  type BuyerBreakdown,
  FULFILMENT_LABELS,
  type Fulfilment,
  type SaleSummary,
  saleSummary,
} from "@repo/domain/utils/orders";
import { foldAccents, slugify as toSlug } from "@repo/domain/utils/slug";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// ---------------------------------------------------------------------------
// Buyers

/** One line of « Acheteurs »: the breakdown plus what the row shows beside it. */
export type BuyerRow = BuyerBreakdown & {
  order: SaleOrder;
  /** Display name of the member who sold it, if any. */
  soldBy: string | null;
  /** The buyer has a stop in a delivery round. */
  inRound: boolean;
  handedOver: boolean;
};

export type StateFilter = "all" | "owing" | "paid";
export type ModeFilter = "all" | "delivery" | "pickup";

export type BuyerFilters = {
  query: string;
  state: StateFilter;
  mode: ModeFilter;
};

export const NO_BUYER_FILTERS: BuyerFilters = {
  query: "",
  state: "all",
  mode: "all",
};

export const STATE_FILTERS: { value: StateFilter; label: string }[] = [
  { value: "all", label: "Tous les états" },
  { value: "owing", label: "À régler" },
  { value: "paid", label: "Payés" },
];

export const MODE_FILTERS: { value: ModeFilter; label: string }[] = [
  { value: "all", label: "Livraison et retrait" },
  { value: "delivery", label: "Livraison" },
  { value: "pickup", label: "Retrait" },
];

/** The sale's totals and its buyers as the page lists them. */
export function saleView(detail: SaleDetail): {
  summary: SaleSummary;
  rows: BuyerRow[];
} {
  const summary = saleSummary(detail.products, detail.orders);
  const byId = new Map(detail.orders.map((o) => [o.id, o]));
  const rows = summary.buyers.flatMap((b) => {
    const order = byId.get(b.orderId);
    if (!order) return [];
    return [
      {
        ...b,
        order,
        soldBy: order.sold_by ? (detail.sellers[order.sold_by] ?? null) : null,
        inRound: order.delivery_recipient_id !== null,
        handedOver: order.handed_over_at !== null,
      },
    ];
  });
  return { summary, rows };
}

/** Lower case, no accents: « Léa » matches « lea », « Chœur » « choeur ». */
export function normalizeText(value: string): string {
  return foldAccents(value).toLowerCase().trim();
}

export function hasBuyerFilters(filters: BuyerFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.state !== "all" ||
    filters.mode !== "all"
  );
}

/**
 * The buyers matching the search (name, phone, « vendu par »; accents and
 * case ignored) and the two filters. The order (alphabetical) is kept.
 */
export function filterBuyers(
  rows: readonly BuyerRow[],
  filters: BuyerFilters,
): BuyerRow[] {
  const query = normalizeText(filters.query);
  return rows.filter((row) => {
    if (filters.mode !== "all" && row.fulfilment !== filters.mode) return false;
    if (filters.state === "owing" && !isOwing(row.status)) return false;
    if (filters.state === "paid" && !isSettled(row.status)) return false;
    if (!query) return true;
    const haystack = normalizeText(
      [
        row.buyerName,
        row.order.buyer_phone ?? "",
        row.soldBy ?? "",
        row.order.buyer_address ?? "",
      ].join(" "),
    );
    return haystack.includes(query);
  });
}

export function isOwing(status: BalanceStatus) {
  return status === "unpaid" || status === "partial";
}

export function isSettled(status: BalanceStatus) {
  return status === "paid" || status === "overpaid";
}

/** The chip's tone: paid in green, partial in amber, unpaid in red, overpaid in blue. */
export const BALANCE_TONES: Record<BalanceStatus, StatusTone> = {
  empty: "neutral",
  unpaid: "danger",
  partial: "warning",
  paid: "success",
  overpaid: "info",
};

export function fulfilmentLabel(value: string): string {
  return FULFILMENT_LABELS[value as Fulfilment] ?? value;
}

// ---------------------------------------------------------------------------
// Sentences

/** « vendredi 13 novembre » (with the year when it isn't this year). */
export function formatDayFr(iso: string, now: Date = new Date()): string {
  const date = parseISO(iso);
  const sameYear = date.getFullYear() === now.getFullYear();
  return format(date, sameYear ? "EEEE d MMMM" : "EEEE d MMMM yyyy", {
    locale: fr,
  });
}

/**
 * « Commandes jusqu'au vendredi 13 novembre · livraison le vendredi 27
 * novembre », or what is known of it; null when neither date is set.
 */
export function saleDatesLine(
  sale: { order_deadline: string | null; delivery_date: string | null },
  now: Date = new Date(),
): string | null {
  const parts = [
    sale.order_deadline &&
      `Commandes jusqu'au ${formatDayFr(sale.order_deadline, now)}`,
    sale.delivery_date &&
      `livraison le ${formatDayFr(sale.delivery_date, now)}`,
  ].filter((part): part is string => !!part);
  if (parts.length === 0) return null;
  const line = parts.join(" · ");
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** « 12 commandes dont 3 à régler », « 1 commande, payée », « Aucune commande ». */
export function orderCountLine(summary: {
  orderCount: number;
  owingCount: number;
}): string {
  const { orderCount, owingCount } = summary;
  if (orderCount === 0) return "Aucune commande";
  const head = orderCount === 1 ? "1 commande" : `${orderCount} commandes`;
  if (owingCount === 0) {
    return orderCount === 1 ? `${head}, payée` : `${head}, toutes payées`;
  }
  return `${head} dont ${owingCount} à régler`;
}

/** « 12 commandes » for the list of sales. */
export function orderCountLabel(count: number): string {
  if (count === 0) return "Aucune commande";
  return count === 1 ? "1 commande" : `${count} commandes`;
}

/** A buyer « Ajouter à la tournée » can add, as its list shows them. */
export type DeliverableBuyer = {
  orderId: string;
  name: string;
  address: string;
};

/**
 * True when the order can get a stop: to be delivered, no stop yet, its
 * personal data still there. Whether it has an address is apart: without
 * one it waits (`deliverableBuyers` counts it).
 */
function awaitsRound(o: SaleOrder): boolean {
  return (
    o.fulfilment === "delivery" &&
    o.delivery_recipient_id === null &&
    o.personal_data_erased_at === null
  );
}

/** The order can join a round now (`awaitsRound`, with an address). */
export function canJoinRound(o: SaleOrder): boolean {
  return awaitsRound(o) && !!o.buyer_address?.trim();
}

/**
 * The buyers « Ajouter à la tournée » can add (to be delivered, with an
 * address, no stop yet), by name as the database adds them, and how many
 * wait for an address.
 */
export function deliverableBuyers(orders: readonly SaleOrder[]): {
  ready: DeliverableBuyer[];
  withoutAddress: number;
} {
  const ready: DeliverableBuyer[] = [];
  let withoutAddress = 0;
  for (const o of orders) {
    if (!awaitsRound(o)) continue;
    const address = o.buyer_address?.trim();
    if (address) ready.push({ orderId: o.id, name: o.buyer_name, address });
    else withoutAddress += 1;
  }
  ready.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return { ready, withoutAddress };
}

/** « 12 ajoutés · 2 sans adresse » after the round was filled. */
export function deliveryResultLine(result: {
  added: number;
  without_address: number;
}): string {
  const added =
    result.added === 0
      ? "Aucun acheteur ajouté"
      : result.added === 1
        ? "1 acheteur ajouté"
        : `${result.added} acheteurs ajoutés`;
  if (result.without_address === 0) return added;
  return `${added} · ${result.without_address} sans adresse`;
}

/** Today in Paris as yyyy-MM-dd (a payment dated by the admin's day, not UTC's). */
export function todayParisIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// ---------------------------------------------------------------------------
// Export (« Exporter (Excel) », see workbook.ts)

/** « fromages-et-saucissons-novembre-2026 » from a sale title. */
export function slugify(title: string): string {
  return toSlug(title) || "vente";
}

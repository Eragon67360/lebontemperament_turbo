// What /api/orders sends and the pages read. Rows follow the tables of
// supabase/migrations/20261013222527_orders.sql; the totals are computed on
// the client with @repo/domain/utils/orders.
import type { Database } from "@repo/domain/database.types";
import type { PaymentMethod } from "@repo/domain/utils/orders";

export type Sale = Database["public"]["Tables"]["order_sales"]["Row"];
export type SaleProduct = Database["public"]["Tables"]["order_products"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderPayment =
  Database["public"]["Tables"]["order_payments"]["Row"];

export type OrderItem = { product_id: string; quantity: number };

/** One order with its quantities and payments (GET /api/orders/sales/[id]). */
export type SaleOrder = OrderRow & {
  items: OrderItem[];
  payments: OrderPayment[];
};

export type SaleDetail = {
  sale: Sale;
  products: SaleProduct[];
  orders: SaleOrder[];
  /** Display names of the members in `sold_by`, by id. */
  sellers: Record<string, string>;
};

/** One row of the sales list (GET /api/orders/sales). */
export type SaleListItem = Sale & {
  orderCount: number;
  totalCents: number;
  /** What buyers still owe. */
  dueCents: number;
};

export type Driver = {
  id: string;
  name: string;
  /**
   * The round « Ajouter à la tournée » would fill (see `currentRound`): null
   * when the driver has none and a new one will be created, absent when it
   * could not be read.
   */
  round?: DriverRound | null;
};

/** The columns of a driver's latest round that `currentRound` reads. */
export type RoundRow = Pick<
  Database["public"]["Tables"]["deliveries"]["Row"],
  "created_at" | "scheduled_at" | "scheduled_end_at"
>;

/** The columns of a stop (`delivery_recipients`) that `currentRound` reads. */
export type RoundStop = Pick<
  Database["public"]["Tables"]["delivery_recipients"]["Row"],
  "id" | "sort_order" | "delivered_at"
>;

/** The round a driver's next add would join, as « Ajouter à la tournée » tells it. */
export type DriverRound = {
  /** When the round was created (`deliveries.created_at`). */
  opened_at: string;
  /** The créneau the driver set in the app, if any. */
  scheduled_at: string | null;
  scheduled_end_at: string | null;
  /** The stops of the round and how many of them are delivered. */
  stops: number;
  delivered: number;
  /** Titles of the sales the stops come from: distinct, in the stops' order. */
  sales: string[];
};

/** What `add_sale_orders_to_delivery` reports. */
export type DeliveryResult = {
  delivery_id: string;
  added: number;
  without_address: number;
};

export type PaymentBody = {
  amount_cents: number;
  method: PaymentMethod;
  paid_on: string | null;
  note: string | null;
};

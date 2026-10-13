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

export type Driver = { id: string; name: string };

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

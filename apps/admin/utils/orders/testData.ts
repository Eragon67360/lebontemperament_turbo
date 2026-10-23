// A fake sale for the orders tests (view.test.ts, workbook.test.ts). Fake
// names and addresses only: the repository is public.
import type { SaleDetail, SaleOrder, SaleProduct } from "./types";

export const SALE_ID = "11111111-1111-4111-8111-111111111111";
export const P = (n: number) =>
  `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
export const O = (n: number) =>
  `bbbbbbbb-bbbb-4bbb-8bbb-${String(n).padStart(12, "0")}`;

export const product = (
  n: number,
  fields: Partial<SaleProduct> & Pick<SaleProduct, "name" | "unit_price_cents">,
): SaleProduct => ({
  id: P(n),
  sale_id: SALE_ID,
  category: "Fromages",
  variant: null,
  supplier: "Fruitière TEST",
  display_order: n * 10,
  is_available: true,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  ...fields,
});

export const order = (
  n: number,
  fields: Partial<SaleOrder> & Pick<SaleOrder, "buyer_name" | "items">,
): SaleOrder => ({
  id: O(n),
  sale_id: SALE_ID,
  buyer_phone: null,
  buyer_address: null,
  sold_by: null,
  fulfilment: "delivery",
  notes: null,
  delivery_recipient_id: null,
  handed_over_at: null,
  personal_data_erased_at: null,
  buyer_member_id: null,
  document_key: null,
  document_name: null,
  document_mime_type: null,
  document_size_bytes: null,
  document_added_at: null,
  created_by: null,
  created_at: "2026-10-02T00:00:00Z",
  updated_at: "2026-10-02T00:00:00Z",
  payments: [],
  ...fields,
});

export const payment = (amount: number, method = "cash") => ({
  id: `cccccccc-cccc-4ccc-8ccc-${String(amount).padStart(12, "0")}`,
  order_id: O(1),
  amount_cents: amount,
  method,
  paid_on: "2026-10-03",
  note: null,
  recorded_by: null,
  created_at: "2026-10-03T00:00:00Z",
});

export const detail: SaleDetail = {
  sale: {
    id: SALE_ID,
    title: "Fromages et saucissons · novembre 2026",
    order_deadline: "2026-11-13",
    delivery_date: "2026-11-27",
    archived_at: null,
    created_by: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  },
  products: [
    product(1, { name: "Comté", variant: "500 g", unit_price_cents: 1100 }),
    product(2, {
      name: "Saucisson",
      variant: "Noix",
      category: "Saucissons",
      supplier: "Salaison TEST",
      unit_price_cents: 400,
    }),
    product(3, {
      name: "Raclette",
      unit_price_cents: 900,
      is_available: false,
    }),
  ],
  orders: [
    order(1, {
      buyer_name: "Léa TEST",
      buyer_phone: "06 12 34 56 78",
      buyer_address: "1 rue de l'Exemple, 67000 Strasbourg",
      sold_by: "dddddddd-dddd-4ddd-8ddd-000000000001",
      items: [
        { product_id: P(1), quantity: 2 },
        { product_id: P(2), quantity: 3 },
      ],
      payments: [payment(2000, "transfer")],
    }),
    order(2, {
      buyer_name: "marc test",
      fulfilment: "pickup",
      items: [{ product_id: P(2), quantity: 1 }],
      payments: [payment(400)],
      handed_over_at: "2026-11-27T10:00:00Z",
    }),
    order(3, {
      buyer_name: "Émile TEST",
      buyer_address: "",
      items: [{ product_id: P(1), quantity: 1 }],
      delivery_recipient_id: null,
    }),
    order(4, {
      buyer_name: "Zoé TEST",
      buyer_address: "2 rue du Test, 67000 Strasbourg",
      items: [{ product_id: P(3), quantity: 1 }],
      payments: [payment(1000)],
      delivery_recipient_id: "eeeeeeee-eeee-4eee-8eee-000000000001",
    }),
  ],
  sellers: { "dddddddd-dddd-4ddd-8ddd-000000000001": "Camille ROTH" },
};

// A member's own orders, as public.member_orders() returns them (migration
// 20261022142528_member_orders.sql): the JSON read safely, and the figures
// the members area shows, from the same rules as the admin
// (./orders). No I/O; unit-tested in memberOrders.test.ts.

import {
  balanceStatus,
  type BalanceStatus,
  type Fulfilment,
  FULFILMENTS,
  groupProductsByCategory,
  orderPaidCents,
  type PaymentMethod,
  PAYMENT_METHODS,
  productLabel,
} from "./orders";

export type MemberOrderItem = {
  productId: string;
  category: string;
  name: string;
  variant: string | null;
  unitPriceCents: number;
  displayOrder: number;
  quantity: number;
};

export type MemberOrderPayment = {
  amountCents: number;
  method: PaymentMethod | null;
  paidOn: string;
};

export type MemberOrderDocument = {
  key: string;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
};

export type MemberOrder = {
  id: string;
  saleTitle: string;
  orderDeadline: string | null;
  deliveryDate: string | null;
  buyerName: string;
  buyerAddress: string | null;
  fulfilment: Fulfilment;
  handedOverAt: string | null;
  inRound: boolean;
  deliveredAt: string | null;
  /** The recipient's tracking link token while the round is live. */
  trackingToken: string | null;
  createdAt: string;
  items: MemberOrderItem[];
  payments: MemberOrderPayment[];
  document: MemberOrderDocument | null;
};

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown): string | null =>
  typeof value === "string" && value !== "" ? value : null;
const int = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) ? value : null;

function readItem(raw: unknown): MemberOrderItem | null {
  if (!isRecord(raw)) return null;
  const productId = str(raw.product_id);
  const name = str(raw.name);
  const quantity = int(raw.quantity);
  const unitPriceCents = int(raw.unit_price_cents);
  if (!productId || !name || quantity === null || unitPriceCents === null) {
    return null;
  }
  return {
    productId,
    category: str(raw.category) ?? "",
    name,
    variant: str(raw.variant),
    unitPriceCents,
    displayOrder: int(raw.display_order) ?? 0,
    quantity,
  };
}

function readPayment(raw: unknown): MemberOrderPayment | null {
  if (!isRecord(raw)) return null;
  const amountCents = int(raw.amount_cents);
  const paidOn = str(raw.paid_on);
  if (amountCents === null || !paidOn) return null;
  const method = (PAYMENT_METHODS as readonly unknown[]).includes(raw.method)
    ? (raw.method as PaymentMethod)
    : null;
  return { amountCents, method, paidOn };
}

function readDocument(raw: unknown): MemberOrderDocument | null {
  if (!isRecord(raw)) return null;
  const key = str(raw.key);
  const name = str(raw.name);
  const mimeType = str(raw.mime_type);
  if (!key || !name || !mimeType) return null;
  return { key, name, mimeType, sizeBytes: int(raw.size_bytes) };
}

/** member_orders()'s answer; anything malformed is skipped, never thrown. */
export function parseMemberOrders(data: unknown): MemberOrder[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((raw): MemberOrder[] => {
    if (!isRecord(raw)) return [];
    const id = str(raw.id);
    const saleTitle = str(raw.sale_title);
    if (!id || !saleTitle) return [];
    const fulfilment = (FULFILMENTS as readonly unknown[]).includes(
      raw.fulfilment,
    )
      ? (raw.fulfilment as Fulfilment)
      : "delivery";
    return [
      {
        id,
        saleTitle,
        orderDeadline: str(raw.order_deadline),
        deliveryDate: str(raw.delivery_date),
        buyerName: str(raw.buyer_name) ?? "",
        buyerAddress: str(raw.buyer_address),
        fulfilment,
        handedOverAt: str(raw.handed_over_at),
        inRound: raw.in_round === true,
        deliveredAt: str(raw.delivered_at),
        trackingToken: str(raw.tracking_token),
        createdAt: str(raw.created_at) ?? "",
        items: (Array.isArray(raw.items) ? raw.items : [])
          .map(readItem)
          .filter((item): item is MemberOrderItem => item !== null),
        payments: (Array.isArray(raw.payments) ? raw.payments : [])
          .map(readPayment)
          .filter((p): p is MemberOrderPayment => p !== null),
        document: readDocument(raw.document),
      },
    ];
  });
}

export type MemberOrderLine = {
  productId: string;
  label: string;
  quantity: number;
  unitPriceCents: number;
  amountCents: number;
};

/** Where the order stands, from the furthest step reached. */
export type MemberOrderStage =
  "received" | "in_round" | "delivered" | "handed_over";

export type MemberOrderFigures = {
  /** The lines by category, in the catalogue's order. */
  groups: { category: string; lines: MemberOrderLine[] }[];
  articleCount: number;
  totalCents: number;
  paidCents: number;
  /** Positive: still to pay; negative: overpaid. */
  dueCents: number;
  status: BalanceStatus;
  stage: MemberOrderStage;
};

export function memberOrderFigures(order: MemberOrder): MemberOrderFigures {
  const products = order.items.map((item) => ({
    id: item.productId,
    category: item.category,
    name: item.name,
    variant: item.variant,
    supplier: null,
    unit_price_cents: item.unitPriceCents,
    display_order: item.displayOrder,
    quantity: item.quantity,
  }));
  const groups = groupProductsByCategory(products).map((group) => ({
    category: group.category,
    lines: group.products.map((p) => ({
      productId: p.id,
      label: productLabel(p),
      quantity: p.quantity,
      unitPriceCents: p.unit_price_cents,
      amountCents: p.quantity * p.unit_price_cents,
    })),
  }));
  const totalCents = products.reduce(
    (sum, p) => sum + p.quantity * p.unit_price_cents,
    0,
  );
  const paidCents = orderPaidCents(
    order.payments.map((p) => ({
      amount_cents: p.amountCents,
      method: p.method ?? "",
    })),
  );
  return {
    groups,
    articleCount: products.reduce((sum, p) => sum + p.quantity, 0),
    totalCents,
    paidCents,
    dueCents: totalCents - paidCents,
    status: balanceStatus(totalCents, paidCents),
    stage: memberOrderStage(order),
  };
}

export function memberOrderStage(order: MemberOrder): MemberOrderStage {
  if (order.deliveredAt) return "delivered";
  if (order.handedOverAt) return "handed_over";
  if (order.inRound) return "in_round";
  return "received";
}

/**
 * The order the members home shows: the first one still to come (not
 * delivered or handed over), else none. The list is newest delivery first.
 */
export function currentMemberOrder(
  orders: readonly MemberOrder[],
): MemberOrder | null {
  return (
    [...orders].reverse().find((o) => !o.deliveredAt && !o.handedOverAt) ?? null
  );
}

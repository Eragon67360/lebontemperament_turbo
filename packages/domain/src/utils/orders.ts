// Orders for the association's sales (« Commandes », superadmins only; tables
// in supabase/migrations/20261013222527_orders.sql). A sale has its own
// catalogue with prices in cents; an order is one buyer with quantities and
// payments. Totals are never stored: they are computed here, for the admin's
// pages, routes and export. The mobile app has the same rules in Dart
// (apps/mobile_app/lib/features/orders/domain/order_totals.dart): change both.

export const PAYMENT_METHODS = ["transfer", "cash", "cheque"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer: "Virement",
  cash: "Espèces",
  cheque: "Chèque",
};

export const FULFILMENTS = ["delivery", "pickup"] as const;
export type Fulfilment = (typeof FULFILMENTS)[number];

export const FULFILMENT_LABELS: Record<Fulfilment, string> = {
  delivery: "Livraison",
  pickup: "Retrait",
};

export type BalanceStatus =
  "empty" | "unpaid" | "partial" | "paid" | "overpaid";

export const BALANCE_LABELS: Record<BalanceStatus, string> = {
  empty: "Rien commandé",
  unpaid: "À payer",
  partial: "Paiement partiel",
  paid: "Payé",
  overpaid: "Trop perçu",
};

export const SALE_TITLE_MAX = 120;
export const PRODUCT_CATEGORY_MAX = 60;
export const PRODUCT_NAME_MAX = 120;
export const PRODUCT_VARIANT_MAX = 60;
export const PRODUCT_SUPPLIER_MAX = 120;
export const PRICE_MAX_CENTS = 100000;
export const BUYER_NAME_MAX = 120;
export const BUYER_PHONE_MAX = 40;
export const BUYER_ADDRESS_MAX = 300;
export const ORDER_NOTES_MAX = 1000;
export const QUANTITY_MAX = 999;
export const PAYMENT_NOTE_MAX = 300;

export type OrderProductLike = {
  id: string;
  category: string;
  name: string;
  variant: string | null;
  supplier: string | null;
  unit_price_cents: number;
  display_order: number;
};

export type OrderItemLike = { product_id: string; quantity: number };
export type OrderPaymentLike = { amount_cents: number; method: string };

export type OrderLike = {
  id: string;
  buyer_name: string;
  fulfilment: string;
  items: readonly OrderItemLike[];
  payments: readonly OrderPaymentLike[];
};

// ---------------------------------------------------------------------------
// Money

const euroFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/** « 11,00 € », « 1 234,50 € » (French spacing), « -4,00 € ». */
export function formatEuros(cents: number): string {
  return euroFormat.format(cents / 100);
}

/** « 8,50 » in a spreadsheet cell: no currency sign, comma decimals. */
export function eurosForSpreadsheet(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Reads an amount typed by a person: « 8,50 », « 8.5 », « 12 », « 12 € ».
 * Returns cents, or null when it isn't an amount with at most two decimals.
 */
export function parseEuros(input: string): number | null {
  const s = input
    .replace(/[\s  ]/g, "")
    .replace(/€$/, "")
    .replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

// ---------------------------------------------------------------------------
// Products and orders

/** « Raclette · 1 kg », « Saucisson · Noix », or the name alone. */
export function productLabel(p: { name: string; variant: string | null }) {
  const variant = p.variant?.trim();
  return variant ? `${p.name} · ${variant}` : p.name;
}

/** Products in the catalogue's order (display order, then label). */
export function sortProducts<T extends OrderProductLike>(
  products: readonly T[],
) {
  return [...products].sort(
    (a, b) =>
      a.display_order - b.display_order ||
      productLabel(a).localeCompare(productLabel(b), "fr"),
  );
}

/** Products grouped by category, categories in the order they first appear. */
export function groupProductsByCategory<T extends OrderProductLike>(
  products: readonly T[],
): { category: string; products: T[] }[] {
  const groups: { category: string; products: T[] }[] = [];
  for (const p of sortProducts(products)) {
    const group = groups.find((g) => g.category === p.category);
    if (group) group.products.push(p);
    else groups.push({ category: p.category, products: [p] });
  }
  return groups;
}

export function productsById<T extends OrderProductLike>(
  products: readonly T[],
): Map<string, T> {
  return new Map(products.map((p) => [p.id, p]));
}

export function orderPaidCents(payments: readonly OrderPaymentLike[]): number {
  return payments.reduce((sum, p) => sum + p.amount_cents, 0);
}

export function balanceStatus(
  totalCents: number,
  paidCents: number,
): BalanceStatus {
  if (totalCents === 0 && paidCents === 0) return "empty";
  if (paidCents > totalCents) return "overpaid";
  if (paidCents === totalCents) return "paid";
  if (paidCents > 0) return "partial";
  return "unpaid";
}

export type OrderLine = {
  productId: string;
  label: string;
  quantity: number;
  unitPriceCents: number;
  amountCents: number;
};

export type BuyerBreakdown = {
  orderId: string;
  buyerName: string;
  fulfilment: string;
  lines: OrderLine[];
  totalCents: number;
  paidCents: number;
  /** What is left to pay; negative when the buyer paid too much. */
  dueCents: number;
  status: BalanceStatus;
};

/** One order: its lines in the catalogue's order, total, paid and due. */
export function buyerBreakdown(
  order: OrderLike,
  byId: ReadonlyMap<string, OrderProductLike>,
): BuyerBreakdown {
  const lines = order.items
    .filter((item) => item.quantity > 0 && byId.has(item.product_id))
    .map((item) => {
      const p = byId.get(item.product_id)!;
      return {
        product: p,
        line: {
          productId: p.id,
          label: productLabel(p),
          quantity: item.quantity,
          unitPriceCents: p.unit_price_cents,
          amountCents: item.quantity * p.unit_price_cents,
        },
      };
    })
    .sort(
      (a, b) =>
        a.product.display_order - b.product.display_order ||
        a.line.label.localeCompare(b.line.label, "fr"),
    )
    .map((x) => x.line);
  const totalCents = lines.reduce((s, l) => s + l.amountCents, 0);
  const paidCents = orderPaidCents(order.payments);
  return {
    orderId: order.id,
    buyerName: order.buyer_name,
    fulfilment: order.fulfilment,
    lines,
    totalCents,
    paidCents,
    dueCents: totalCents - paidCents,
    status: balanceStatus(totalCents, paidCents),
  };
}

export type ProductTotal = {
  productId: string;
  label: string;
  category: string;
  supplier: string | null;
  quantity: number;
  amountCents: number;
};

export type SupplierTotal = {
  /** null: products without a supplier. */
  supplier: string | null;
  quantity: number;
  amountCents: number;
  products: ProductTotal[];
};

export type SaleSummary = {
  orderCount: number;
  totalCents: number;
  paidCents: number;
  /** Sum of what buyers still owe (overpayments don't offset it). */
  dueCents: number;
  /** Sum of what buyers paid too much. */
  overpaidCents: number;
  /** Orders fully paid (or overpaid). */
  paidCount: number;
  /** Orders with something left to pay. */
  owingCount: number;
  byMethod: Record<PaymentMethod, number>;
  /** Every order, buyers in alphabetical order. */
  buyers: BuyerBreakdown[];
  /** Ordered products only (quantity > 0), in the catalogue's order. */
  products: ProductTotal[];
  /** The same products by supplier, for the orders to place. */
  suppliers: SupplierTotal[];
};

export function saleSummary(
  products: readonly OrderProductLike[],
  orders: readonly OrderLike[],
): SaleSummary {
  const byId = productsById(products);
  const buyers = orders
    .map((o) => buyerBreakdown(o, byId))
    .sort(
      (a, b) =>
        a.buyerName.localeCompare(b.buyerName, "fr", { sensitivity: "base" }) ||
        a.orderId.localeCompare(b.orderId),
    );

  const byMethod: Record<PaymentMethod, number> = {
    transfer: 0,
    cash: 0,
    cheque: 0,
  };
  for (const o of orders) {
    for (const p of o.payments) {
      if ((PAYMENT_METHODS as readonly string[]).includes(p.method)) {
        byMethod[p.method as PaymentMethod] += p.amount_cents;
      }
    }
  }

  const quantities = new Map<string, number>();
  for (const o of orders) {
    for (const item of o.items) {
      if (item.quantity > 0 && byId.has(item.product_id)) {
        quantities.set(
          item.product_id,
          (quantities.get(item.product_id) ?? 0) + item.quantity,
        );
      }
    }
  }
  const productTotals: ProductTotal[] = sortProducts(products)
    .filter((p) => (quantities.get(p.id) ?? 0) > 0)
    .map((p) => {
      const quantity = quantities.get(p.id)!;
      return {
        productId: p.id,
        label: productLabel(p),
        category: p.category,
        supplier: p.supplier?.trim() || null,
        quantity,
        amountCents: quantity * p.unit_price_cents,
      };
    });

  const suppliers: SupplierTotal[] = [];
  for (const t of productTotals) {
    let s = suppliers.find((x) => x.supplier === t.supplier);
    if (!s) {
      s = { supplier: t.supplier, quantity: 0, amountCents: 0, products: [] };
      suppliers.push(s);
    }
    s.quantity += t.quantity;
    s.amountCents += t.amountCents;
    s.products.push(t);
  }

  return {
    orderCount: orders.length,
    totalCents: buyers.reduce((s, b) => s + b.totalCents, 0),
    paidCents: buyers.reduce((s, b) => s + b.paidCents, 0),
    dueCents: buyers.reduce((s, b) => s + Math.max(b.dueCents, 0), 0),
    overpaidCents: buyers.reduce((s, b) => s + Math.max(-b.dueCents, 0), 0),
    paidCount: buyers.filter(
      (b) => b.status === "paid" || b.status === "overpaid",
    ).length,
    owingCount: buyers.filter(
      (b) => b.status === "unpaid" || b.status === "partial",
    ).length,
    byMethod,
    buyers,
    products: productTotals,
    suppliers,
  };
}

// ---------------------------------------------------------------------------
// Spreadsheet export (one row per buyer, one column per ordered product)

export function saleSpreadsheet(
  summary: SaleSummary,
  extra: ReadonlyMap<
    string,
    { phone?: string | null; address?: string | null; soldBy?: string | null }
  > = new Map(),
): string[][] {
  const header = [
    "Acheteur",
    "Téléphone",
    "Adresse",
    "Vendu par",
    "Mode",
    ...summary.products.map((p) => p.label),
    "Total (€)",
    "Payé (€)",
    "Reste à payer (€)",
    "État",
  ];
  const rows = summary.buyers.map((b) => {
    const x = extra.get(b.orderId) ?? {};
    const qty = new Map(b.lines.map((l) => [l.productId, l.quantity]));
    return [
      b.buyerName,
      x.phone ?? "",
      x.address ?? "",
      x.soldBy ?? "",
      FULFILMENT_LABELS[b.fulfilment as Fulfilment] ?? b.fulfilment,
      ...summary.products.map((p) => String(qty.get(p.productId) ?? "")),
      eurosForSpreadsheet(b.totalCents),
      eurosForSpreadsheet(b.paidCents),
      eurosForSpreadsheet(b.dueCents),
      BALANCE_LABELS[b.status],
    ];
  });
  const totals = [
    "Total",
    "",
    "",
    "",
    "",
    ...summary.products.map((p) => String(p.quantity)),
    eurosForSpreadsheet(summary.totalCents),
    eurosForSpreadsheet(summary.paidCents),
    eurosForSpreadsheet(summary.dueCents - summary.overpaidCents),
    "",
  ];
  return [header, ...rows, totals];
}

// ---------------------------------------------------------------------------
// Phones (same rule as public.normalize_order_phone)

/**
 * « 06 12 34 56 78 » → « +33612345678 » (the form SMS need); « 0041… » →
 * « +41… »; anything else without spaces; empty → null.
 */
export function normalizePhone(
  input: string | null | undefined,
): string | null {
  const d = (input ?? "").replace(/[\s.\-()/]/g, "");
  if (d === "") return null;
  if (/^0[1-9]\d{8}$/.test(d)) return `+33${d.slice(1)}`;
  if (/^0033[1-9]\d{8}$/.test(d)) return `+${d.slice(2)}`;
  if (/^00[1-9]\d{6,14}$/.test(d)) return `+${d.slice(2)}`;
  return d;
}

/** True for a number an SMS can reach once normalised. */
export function isValidPhone(input: string): boolean {
  const n = normalizePhone(input);
  return n !== null && /^\+[1-9]\d{6,14}$/.test(n);
}

/**
 * How a buyer's number is shown and stored: a French number in any usual
 * form (« 0677565184 », « +33 6 77 56 51 84 », « 0033… ») becomes
 * « 06 77 56 51 84 ». A French number still being typed (« 06775 ») gets its
 * pairs (« 06 77 5 »); anything else, foreign numbers included, is kept as
 * written. The app's formatPhone follows the same rule.
 */
export function formatPhone(input: string): string {
  const d = input.replace(/[\s.\-()/]/g, "");
  const pairs = (digits: string) => digits.replace(/(\d{2})(?=\d)/g, "$1 ");
  if (/^0([1-9]\d{0,8})?$/.test(d)) return pairs(d);
  const intl = /^(?:\+33|0033)0?([1-9]\d{8})$/.exec(d);
  if (intl) return pairs(`0${intl[1]}`);
  return input;
}

// ---------------------------------------------------------------------------
// Input checks for the admin's routes (the database checks the same limits)

export type Parsed<T> =
  { ok: true; value: T } | { ok: false; error: string; field?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDay(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function text(
  body: Record<string, unknown>,
  field: string,
  max: number,
  label: string,
  required: boolean,
): Parsed<string | null> {
  const raw = body[field];
  if (raw === undefined || raw === null || raw === "") {
    return required
      ? { ok: false, error: `${label} est obligatoire`, field }
      : { ok: true, value: null };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: `${label} doit être un texte`, field };
  }
  const value = raw.trim();
  if (value === "") {
    return required
      ? { ok: false, error: `${label} est obligatoire`, field }
      : { ok: true, value: null };
  }
  if (value.length > max) {
    return { ok: false, error: `${label} : ${max} caractères au plus`, field };
  }
  return { ok: true, value };
}

function day(
  body: Record<string, unknown>,
  field: string,
  label: string,
): Parsed<string | null> {
  const raw = body[field];
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, value: null };
  }
  if (typeof raw !== "string" || !isIsoDay(raw)) {
    return { ok: false, error: `${label} n'est pas une date valide`, field };
  }
  return { ok: true, value: raw };
}

export type SaleInput = {
  title: string;
  order_deadline: string | null;
  delivery_date: string | null;
};

export function parseSaleInput(body: unknown): Parsed<SaleInput> {
  if (!isRecord(body)) return { ok: false, error: "Données invalides" };
  const title = text(body, "title", SALE_TITLE_MAX, "Le nom de la vente", true);
  if (!title.ok) return title;
  const deadline = day(body, "order_deadline", "La date limite");
  if (!deadline.ok) return deadline;
  const delivery = day(body, "delivery_date", "Le jour de livraison");
  if (!delivery.ok) return delivery;
  if (deadline.value && delivery.value && deadline.value > delivery.value) {
    return {
      ok: false,
      error: "La date limite doit précéder le jour de livraison",
      field: "order_deadline",
    };
  }
  return {
    ok: true,
    value: {
      title: title.value!,
      order_deadline: deadline.value,
      delivery_date: delivery.value,
    },
  };
}

export type ProductInput = {
  category: string;
  name: string;
  variant: string | null;
  supplier: string | null;
  unit_price_cents: number;
  is_available: boolean;
};

export function parseProductInput(body: unknown): Parsed<ProductInput> {
  if (!isRecord(body)) return { ok: false, error: "Données invalides" };
  const category = text(
    body,
    "category",
    PRODUCT_CATEGORY_MAX,
    "La catégorie",
    true,
  );
  if (!category.ok) return category;
  const name = text(body, "name", PRODUCT_NAME_MAX, "Le nom du produit", true);
  if (!name.ok) return name;
  const variant = text(
    body,
    "variant",
    PRODUCT_VARIANT_MAX,
    "La précision",
    false,
  );
  if (!variant.ok) return variant;
  const supplier = text(
    body,
    "supplier",
    PRODUCT_SUPPLIER_MAX,
    "Le fournisseur",
    false,
  );
  if (!supplier.ok) return supplier;
  const price = body.unit_price_cents;
  if (
    typeof price !== "number" ||
    !Number.isInteger(price) ||
    price < 0 ||
    price > PRICE_MAX_CENTS
  ) {
    return {
      ok: false,
      error: "Le prix doit être un montant entre 0 et 1 000 €",
      field: "unit_price_cents",
    };
  }
  const available = body.is_available ?? true;
  if (typeof available !== "boolean") {
    return {
      ok: false,
      error: "Disponibilité invalide",
      field: "is_available",
    };
  }
  return {
    ok: true,
    value: {
      category: category.value!,
      name: name.value!,
      variant: variant.value,
      supplier: supplier.value,
      unit_price_cents: price,
      is_available: available,
    },
  };
}

export type OrderInput = {
  order: {
    buyer_name: string;
    buyer_phone: string | null;
    buyer_address: string | null;
    sold_by: string | null;
    fulfilment: Fulfilment;
    notes: string | null;
    /** The member who bought it (their « Mes commandes »); null when none. */
    buyer_member_id: string | null;
  };
  items: { product_id: string; quantity: number }[];
};

/**
 * One order as sent to `save_order`. `productIds` are the sale's products:
 * anything else is refused. Quantities of 0 are dropped; at least one product
 * must remain.
 */
export function parseOrderInput(
  body: unknown,
  productIds: ReadonlySet<string>,
): Parsed<OrderInput> {
  if (!isRecord(body)) return { ok: false, error: "Données invalides" };
  const name = text(
    body,
    "buyer_name",
    BUYER_NAME_MAX,
    "Le nom de l'acheteur",
    true,
  );
  if (!name.ok) return name;
  const phone = text(
    body,
    "buyer_phone",
    BUYER_PHONE_MAX,
    "Le téléphone",
    false,
  );
  if (!phone.ok) return phone;
  if (phone.value && !isValidPhone(phone.value)) {
    return {
      ok: false,
      error: "Ce numéro de téléphone n'est pas valide",
      field: "buyer_phone",
    };
  }
  const address = text(
    body,
    "buyer_address",
    BUYER_ADDRESS_MAX,
    "L'adresse",
    false,
  );
  if (!address.ok) return address;
  const notes = text(body, "notes", ORDER_NOTES_MAX, "La remarque", false);
  if (!notes.ok) return notes;
  const soldBy = body.sold_by ?? null;
  if (soldBy !== null && soldBy !== "" && !isUuid(soldBy)) {
    return { ok: false, error: "Vendeur inconnu", field: "sold_by" };
  }
  const buyerMember = body.buyer_member_id ?? null;
  if (buyerMember !== null && buyerMember !== "" && !isUuid(buyerMember)) {
    return { ok: false, error: "Membre inconnu", field: "buyer_member_id" };
  }
  const fulfilment = body.fulfilment ?? "delivery";
  if (!(FULFILMENTS as readonly unknown[]).includes(fulfilment)) {
    return { ok: false, error: "Mode de remise inconnu", field: "fulfilment" };
  }

  const rawItems = body.items;
  if (!Array.isArray(rawItems)) {
    return { ok: false, error: "Ajoutez au moins un produit", field: "items" };
  }
  const items: { product_id: string; quantity: number }[] = [];
  const seen = new Set<string>();
  for (const raw of rawItems) {
    if (
      !isRecord(raw) ||
      !isUuid(raw.product_id) ||
      !productIds.has(raw.product_id)
    ) {
      return {
        ok: false,
        error: "Produit inconnu dans cette vente",
        field: "items",
      };
    }
    const q = raw.quantity;
    if (
      typeof q !== "number" ||
      !Number.isInteger(q) ||
      q < 0 ||
      q > QUANTITY_MAX
    ) {
      return {
        ok: false,
        error: `Les quantités vont de 0 à ${QUANTITY_MAX}`,
        field: "items",
      };
    }
    if (seen.has(raw.product_id)) {
      return {
        ok: false,
        error: "Un produit apparaît deux fois",
        field: "items",
      };
    }
    seen.add(raw.product_id);
    if (q > 0) items.push({ product_id: raw.product_id, quantity: q });
  }
  if (items.length === 0) {
    return { ok: false, error: "Ajoutez au moins un produit", field: "items" };
  }

  return {
    ok: true,
    value: {
      order: {
        buyer_name: name.value!,
        buyer_phone: phone.value ? formatPhone(phone.value) : null,
        buyer_address: address.value,
        sold_by: soldBy === "" ? null : (soldBy as string | null),
        fulfilment: fulfilment as Fulfilment,
        notes: notes.value,
        buyer_member_id:
          buyerMember === "" ? null : (buyerMember as string | null),
      },
      items,
    },
  };
}

export type PaymentInput = {
  amount_cents: number;
  method: PaymentMethod;
  paid_on: string | null;
  note: string | null;
};

export function parsePaymentInput(body: unknown): Parsed<PaymentInput> {
  if (!isRecord(body)) return { ok: false, error: "Données invalides" };
  const amount = body.amount_cents;
  if (
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount === 0 ||
    Math.abs(amount) > PRICE_MAX_CENTS
  ) {
    return {
      ok: false,
      error: "Le montant doit être différent de 0 et d'au plus 1 000 €",
      field: "amount_cents",
    };
  }
  const method = body.method;
  if (!(PAYMENT_METHODS as readonly unknown[]).includes(method)) {
    return {
      ok: false,
      error: "Choisissez un moyen de paiement",
      field: "method",
    };
  }
  const paidOn = day(body, "paid_on", "La date du paiement");
  if (!paidOn.ok) return paidOn;
  const note = text(body, "note", PAYMENT_NOTE_MAX, "La remarque", false);
  if (!note.ok) return note;
  return {
    ok: true,
    value: {
      amount_cents: amount,
      method: method as PaymentMethod,
      paid_on: paidOn.value,
      note: note.value,
    },
  };
}

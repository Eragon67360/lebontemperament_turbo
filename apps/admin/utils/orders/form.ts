// The forms of « Commandes » (react-hook-form + zod): what the admin types,
// the French messages, and the bodies sent to /api/orders. The server checks
// everything again with @repo/domain/utils/orders; these rules only give the
// answer before the round trip. Pure and unit-tested (form.test.ts).
import type { SaleOrder, SaleProduct } from "@/utils/orders/types";
import {
  BUYER_ADDRESS_MAX,
  BUYER_NAME_MAX,
  formatPhone,
  FULFILMENTS,
  isValidPhone,
  ORDER_NOTES_MAX,
  type OrderInput,
  parseEuros,
  PAYMENT_METHODS,
  PAYMENT_NOTE_MAX,
  type PaymentMethod,
  PRICE_MAX_CENTS,
  PRODUCT_CATEGORY_MAX,
  PRODUCT_NAME_MAX,
  PRODUCT_SUPPLIER_MAX,
  PRODUCT_VARIANT_MAX,
  type ProductInput,
  QUANTITY_MAX,
  SALE_TITLE_MAX,
  type SaleInput,
} from "@repo/domain/utils/orders";
import { format, parseISO } from "date-fns";
import { z } from "zod";

/** The Select value for « Personne » (« vendu par ») and « Aucune » (copy). */
export const NONE = "none";

const requiredText = (message: string, max: number) =>
  z
    .string({ error: message })
    .trim()
    .min(1, message)
    .max(max, `${max} caractères au plus`);

const optionalText = (max: number) =>
  z.string().trim().max(max, `${max} caractères au plus`);

/** « 8,50 », « 12 », « 12 € » typed by a person, checked as an amount. */
const euros = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => parseEuros(value) !== null, message);

/** A day picked in the calendar; `undefined` when none. */
const day = z.date().optional();

/** yyyy-MM-dd in the admin's own time zone (never `toISOString`, which is UTC). */
export function isoDay(date: Date | undefined | null): string | null {
  return date ? format(date, "yyyy-MM-dd") : null;
}

export function dayFromIso(iso: string | null | undefined): Date | undefined {
  return iso ? parseISO(iso) : undefined;
}

// ---------------------------------------------------------------------------
// Sale (« Nouvelle vente », « Modifier la vente »)

export const saleFormSchema = z
  .object({
    title: requiredText("Le nom de la vente est requis", SALE_TITLE_MAX),
    order_deadline: day,
    delivery_date: day,
    /** The sale whose catalogue is copied (creation only); NONE for an empty one. */
    copy_from: z.string(),
  })
  .refine(
    (v) =>
      !v.order_deadline ||
      !v.delivery_date ||
      v.order_deadline.getTime() <= v.delivery_date.getTime(),
    {
      message: "La date limite doit précéder le jour de livraison",
      path: ["order_deadline"],
    },
  );
export type SaleFormValues = z.output<typeof saleFormSchema>;

export function saleFormDefaults(
  sale: {
    title: string;
    order_deadline: string | null;
    delivery_date: string | null;
  } | null,
  copyFrom: string | null,
): SaleFormValues {
  return {
    title: sale?.title ?? "",
    order_deadline: dayFromIso(sale?.order_deadline),
    delivery_date: dayFromIso(sale?.delivery_date),
    copy_from: copyFrom ?? NONE,
  };
}

export function saleFormToBody(
  values: SaleFormValues,
): SaleInput & { copy_from: string | null } {
  return {
    title: values.title.trim(),
    order_deadline: isoDay(values.order_deadline),
    delivery_date: isoDay(values.delivery_date),
    copy_from: values.copy_from === NONE ? null : values.copy_from,
  };
}

// ---------------------------------------------------------------------------
// Product (« Ajouter un produit », « Modifier »)

export const productFormSchema = z.object({
  category: requiredText("La catégorie est requise", PRODUCT_CATEGORY_MAX),
  name: requiredText("Le nom du produit est requis", PRODUCT_NAME_MAX),
  variant: optionalText(PRODUCT_VARIANT_MAX),
  supplier: optionalText(PRODUCT_SUPPLIER_MAX),
  price: euros("Le prix doit être un montant, par exemple 11,00").refine(
    (value) => {
      const cents = parseEuros(value);
      return cents !== null && cents >= 0 && cents <= PRICE_MAX_CENTS;
    },
    "Le prix doit être un montant entre 0 et 1 000 €",
  ),
  is_available: z.boolean(),
});
export type ProductFormValues = z.output<typeof productFormSchema>;

/** « 11,00 » for the price input. */
export function eurosInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function productFormDefaults(
  product: SaleProduct | null,
  /** The category of the list the button was pressed in, for a new product. */
  category = "",
): ProductFormValues {
  return {
    category: product?.category ?? category,
    name: product?.name ?? "",
    variant: product?.variant ?? "",
    supplier: product?.supplier ?? "",
    price: product ? eurosInput(product.unit_price_cents) : "",
    is_available: product?.is_available ?? true,
  };
}

export function productFormToBody(values: ProductFormValues): ProductInput {
  return {
    category: values.category.trim(),
    name: values.name.trim(),
    variant: values.variant.trim() || null,
    supplier: values.supplier.trim() || null,
    unit_price_cents: parseEuros(values.price) ?? 0,
    is_available: values.is_available,
  };
}

// ---------------------------------------------------------------------------
// Order (« Ajouter une commande », « Modifier »)

export const orderFormSchema = z.object({
  buyer_name: requiredText("Le nom de l'acheteur est requis", BUYER_NAME_MAX),
  buyer_phone: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || isValidPhone(value),
      "Ce numéro de téléphone n'est pas valide",
    ),
  buyer_address: optionalText(BUYER_ADDRESS_MAX),
  /** A member's id, or NONE. */
  sold_by: z.string(),
  fulfilment: z.enum(FULFILMENTS),
  notes: optionalText(ORDER_NOTES_MAX),
  /** Quantity by product id; 0 means not ordered. */
  quantities: z
    .record(z.string(), z.number().int().min(0).max(QUANTITY_MAX))
    .refine((q) => Object.values(q).some((n) => n > 0), {
      message: "Ajoutez au moins un produit",
    }),
});
export type OrderFormValues = z.output<typeof orderFormSchema>;

export function orderFormDefaults(
  order: SaleOrder | null,
  products: readonly SaleProduct[],
): OrderFormValues {
  const quantities: Record<string, number> = {};
  for (const p of products) quantities[p.id] = 0;
  for (const item of order?.items ?? []) {
    if (item.product_id in quantities)
      quantities[item.product_id] = item.quantity;
  }
  return {
    buyer_name: order?.buyer_name ?? "",
    buyer_phone: order?.buyer_phone ?? "",
    buyer_address: order?.buyer_address ?? "",
    sold_by: order?.sold_by ?? NONE,
    fulfilment:
      (order?.fulfilment as OrderFormValues["fulfilment"]) ?? "delivery",
    notes: order?.notes ?? "",
    quantities,
  };
}

export function orderFormToBody(
  values: OrderFormValues,
): OrderInput["order"] & { items: OrderInput["items"] } {
  return {
    buyer_name: values.buyer_name.trim(),
    buyer_phone: formatPhone(values.buyer_phone).trim() || null,
    buyer_address: values.buyer_address.trim() || null,
    sold_by: values.sold_by === NONE ? null : values.sold_by,
    fulfilment: values.fulfilment,
    notes: values.notes.trim() || null,
    items: Object.entries(values.quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([product_id, quantity]) => ({ product_id, quantity })),
  };
}

/**
 * The products the order form lists: the available ones, plus any product
 * already in the order (so an order keeps what it has even once the product
 * is hidden from new orders).
 */
export function orderableProducts<T extends SaleProduct>(
  products: readonly T[],
  order: SaleOrder | null,
): T[] {
  const inOrder = new Set(
    (order?.items ?? [])
      .filter((item) => item.quantity > 0)
      .map((item) => item.product_id),
  );
  return products.filter((p) => p.is_available || inOrder.has(p.id));
}

/** The live total of the form, in cents. */
export function quantitiesTotalCents(
  quantities: Readonly<Record<string, number>>,
  products: readonly SaleProduct[],
): number {
  return products.reduce(
    (sum, p) => sum + (quantities[p.id] ?? 0) * p.unit_price_cents,
    0,
  );
}

/** A stepper's next value, kept within 0 and the maximum. */
export function stepQuantity(current: number, delta: number): number {
  return Math.min(QUANTITY_MAX, Math.max(0, current + delta));
}

/** What a typed quantity means: digits only, 0 when emptied, capped. */
export function readQuantity(text: string): number {
  const digits = text.replace(/\D/g, "");
  if (digits === "") return 0;
  return Math.min(QUANTITY_MAX, Number(digits));
}

/** True when the order is to be delivered but has no address: the round can't take it. */
export function missesDeliveryAddress(values: {
  fulfilment: string;
  buyer_address: string;
}): boolean {
  return values.fulfilment === "delivery" && values.buyer_address.trim() === "";
}

// ---------------------------------------------------------------------------
// Payment (« Enregistrer un paiement »)

export const paymentFormSchema = z.object({
  amount: euros("Le montant doit être un nombre, par exemple 8,50").refine(
    (value) => {
      const cents = parseEuros(value);
      return (
        cents !== null && cents !== 0 && Math.abs(cents) <= PRICE_MAX_CENTS
      );
    },
    "Le montant doit être différent de 0 et d'au plus 1 000 €",
  ),
  method: z.enum(PAYMENT_METHODS, { error: "Choisissez un moyen de paiement" }),
  paid_on: z.date({ error: "La date du paiement est requise" }),
  note: optionalText(PAYMENT_NOTE_MAX),
});
export type PaymentFormValues = z.output<typeof paymentFormSchema>;

export function paymentFormDefaults(
  /** What is left to pay, prefilled when positive. */
  dueCents: number,
  todayIso: string,
): PaymentFormValues {
  return {
    amount: dueCents > 0 ? eurosInput(dueCents) : "",
    method: undefined as unknown as PaymentMethod,
    paid_on: parseISO(todayIso),
    note: "",
  };
}

export function paymentFormToBody(values: PaymentFormValues) {
  return {
    amount_cents: parseEuros(values.amount) ?? 0,
    method: values.method,
    paid_on: isoDay(values.paid_on),
    note: values.note.trim() || null,
  };
}

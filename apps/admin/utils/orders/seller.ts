// « Mes ventes »: what the seller's pages and /api/ventes routes share. A
// seller is a member a superadmin added to a sale (order_sale_sellers); they
// need no admin role. The database functions seller_* check auth.uid() and
// only ever touch the caller's own orders (migration
// 20261123181503_order_sellers.sql); these helpers only shape their answers.
import type { SaleDetail, SaleOrder } from "@/utils/orders/types";
import type { createClient } from "@/utils/supabase/server";
import type { Json } from "@repo/domain/database.types";
import type { OrderInput } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";
import { dbErrorResponse, type DbErrorLike } from "./server";

type Client = Awaited<ReturnType<typeof createClient>>;

/** What a 42501 from a seller_* function means for the seller. */
export const NOT_A_SELLER = "Vous ne vendez pas pour cette vente";

/** One of the signed-in member's sales (seller_sales()). */
export type SellerSale = {
  id: string;
  title: string;
  order_deadline: string | null;
  delivery_date: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const textOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

/** seller_sales()'s JSON as a list; anything malformed is left out. */
export function parseSellerSales(json: Json | null | undefined): SellerSale[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    if (typeof entry.id !== "string" || typeof entry.title !== "string") {
      return [];
    }
    return [
      {
        id: entry.id,
        title: entry.title,
        order_deadline: textOrNull(entry.order_deadline),
        delivery_date: textOrNull(entry.delivery_date),
      },
    ];
  });
}

/**
 * seller_sale()'s JSON as the sale page's detail: the seller's own orders,
 * with the columns the function leaves out (the member link and the order
 * form, superadmin matters) set to null so the page's helpers read them as
 * for any order. `me` names the seller, the only « vendu par » here.
 */
export function sellerDetail(
  json: Json | null | undefined,
  me: { id: string; name: string },
): SaleDetail | null {
  if (!isRecord(json) || !isRecord(json.sale)) return null;
  const products: unknown[] = Array.isArray(json.products) ? json.products : [];
  const orders: unknown[] = Array.isArray(json.orders) ? json.orders : [];
  return {
    sale: json.sale as unknown as SaleDetail["sale"],
    products: products as unknown as SaleDetail["products"],
    orders: orders.filter(isRecord).map(
      (order) =>
        ({
          buyer_member_id: null,
          document_key: null,
          document_name: null,
          document_mime_type: null,
          document_size_bytes: null,
          document_added_at: null,
          ...order,
          items: Array.isArray(order.items) ? order.items : [],
          payments: Array.isArray(order.payments) ? order.payments : [],
        }) as unknown as SaleOrder,
    ),
    sellers: { [me.id]: me.name },
    saleSellers: [me.id],
  };
}

/** The signed-in member's sales; empty when they sell for none (or on error). */
export async function mySellerSales(supabase: Client): Promise<SellerSale[]> {
  const { data, error } = await supabase.rpc("seller_sales");
  if (error) return [];
  return parseSellerSales(data);
}

/** The JSON answer for a seller_* function's error, worded for a seller. */
export function sellerDbErrorResponse(error: DbErrorLike, fallback: string) {
  return dbErrorResponse(error, fallback, NOT_A_SELLER);
}

/**
 * Every /api/ventes route starts here: 401 when signed out. Whether the
 * member sells for the sale is the database's check, on every call.
 */
export async function requireSignedIn(supabase: Client) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Non connecté" }, { status: 401 }),
    };
  }
  return { ok: true as const, user: data.user };
}

/** « Prénom NOM » of the signed-in member, as the admins keep it. */
export async function myName(supabase: Client, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", userId)
    .maybeSingle();
  return data?.display_name?.trim() || data?.email?.split("@")[0] || "Vous";
}

/**
 * The sale as its seller sees it (seller_sale), or the answer to send:
 * 403 when the member does not sell for it, 404 when it can't be read.
 */
export async function loadSellerSale(
  supabase: Client,
  saleId: string,
  me: { id: string; name: string },
): Promise<
  { ok: true; detail: SaleDetail } | { ok: false; response: NextResponse }
> {
  const { data, error } = await supabase.rpc("seller_sale", {
    p_sale_id: saleId,
  });
  if (error) {
    return {
      ok: false,
      response: sellerDbErrorResponse(
        error,
        "La vente n'a pas pu être chargée",
      ),
    };
  }
  const detail = sellerDetail(data, me);
  if (!detail) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Vente introuvable" },
        { status: 404 },
      ),
    };
  }
  return { ok: true, detail };
}

/**
 * What seller_save_order takes from a parsed order: the buyer and how it is
 * handed over. Never who sold it (the seller) nor a member link.
 */
export function sellerOrderBody(order: OrderInput["order"]) {
  return {
    buyer_name: order.buyer_name,
    buyer_phone: order.buyer_phone,
    buyer_address: order.buyer_address,
    fulfilment: order.fulfilment,
    notes: order.notes,
  };
}

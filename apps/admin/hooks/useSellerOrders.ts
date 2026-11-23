// « Mes ventes »: the seller's queries and writes (/api/ventes). Same shapes
// as the superadmins' hooks (useOrders), on the seller's own orders only.
import {
  OrderApiError,
  retryUnlessFinal,
  saleKey,
  SALES_KEY,
  send,
} from "@/hooks/useOrders";
import type { SellerSale } from "@/utils/orders/seller";
import type {
  OrderPayment,
  PaymentBody,
  SaleDetail,
} from "@/utils/orders/types";
import type { OrderInput } from "@repo/domain/utils/orders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type { SellerSale };

export const SELLER_SALES_KEY = ["orders", "seller", "sales"];
export const sellerSaleKey = (saleId: string) => [
  "orders",
  "seller",
  "sale",
  saleId,
];
const BASE = "/api/ventes";

/** The sales the signed-in member sells for, and who they are. */
export function useSellerSales() {
  return useQuery({
    queryKey: SELLER_SALES_KEY,
    queryFn: () =>
      send<{ sales: SellerSale[]; me: { id: string; name: string } }>(
        BASE,
        "GET",
      ),
    staleTime: 5 * 60 * 1000,
    retry: retryUnlessFinal,
  });
}

/** One sale as its seller sees it: the catalogue and their own buyers. */
export function useSellerSale(saleId: string | undefined) {
  return useQuery({
    queryKey: sellerSaleKey(saleId ?? ""),
    queryFn: () => send<SaleDetail>(`${BASE}/${saleId}`, "GET"),
    enabled: !!saleId,
    retry: retryUnlessFinal,
  });
}

/** After a write: the seller's page, and the superadmins' if they are one. */
function useRefresh(saleId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: sellerSaleKey(saleId) });
    queryClient.invalidateQueries({ queryKey: SALES_KEY });
    queryClient.invalidateQueries({ queryKey: saleKey(saleId) });
  };
}

/** Creates (no `orderId`) or replaces one of the seller's orders. */
export function useSellerSaveOrder(saleId: string) {
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: ({
      orderId,
      ...body
    }: OrderInput["order"] & {
      items: OrderInput["items"];
      orderId?: string;
    }) =>
      orderId
        ? send<{ id: string }>(
            `${BASE}/${saleId}/orders/${orderId}`,
            "PUT",
            body,
          )
        : send<{ id: string }>(`${BASE}/${saleId}/orders`, "POST", body),
    onSuccess: refresh,
  });
}

export function useSellerDeleteOrder(saleId: string) {
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: (orderId: string) =>
      send<{ ok: true }>(`${BASE}/${saleId}/orders/${orderId}`, "DELETE"),
    onSuccess: refresh,
  });
}

export function useSellerAddPayment(saleId: string) {
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: ({ orderId, ...body }: PaymentBody & { orderId: string }) =>
      send<OrderPayment>(
        `${BASE}/${saleId}/orders/${orderId}/payments`,
        "POST",
        body,
      ),
    onSuccess: refresh,
  });
}

export function useSellerDeletePayment(saleId: string) {
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: ({
      orderId,
      paymentId,
    }: {
      orderId: string;
      paymentId: string;
    }) =>
      send<{ ok: true }>(
        `${BASE}/${saleId}/orders/${orderId}/payments/${paymentId}`,
        "DELETE",
      ),
    onSuccess: refresh,
  });
}

export { OrderApiError };

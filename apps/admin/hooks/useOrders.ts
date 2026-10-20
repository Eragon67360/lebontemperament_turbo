import { NotInstalledError } from "@/hooks/useDocuments";
import type {
  DeliveryResult,
  Driver,
  OrderPayment,
  PaymentBody,
  Sale,
  SaleDetail,
  SaleListItem,
  SaleProduct,
} from "@/utils/orders/types";
import type {
  OrderInput,
  ProductInput,
  SaleInput,
} from "@repo/domain/utils/orders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type {
  DeliveryResult,
  Driver,
  Sale,
  SaleDetail,
  SaleListItem,
  SaleProduct,
};

/**
 * A refused request: the server's sentence, its HTTP status and, for a value
 * the rules refuse (400), the field it is about.
 */
export class OrderApiError extends Error {
  status: number;
  field?: string;

  constructor(message: string, status: number, field?: string) {
    super(message);
    this.name = "OrderApiError";
    this.status = status;
    this.field = field;
  }
}

export const SALES_KEY = ["orders", "sales"];
export const saleKey = (saleId: string) => ["orders", "sale", saleId];
const DRIVERS_KEY = ["orders", "drivers"];
const BASE = "/api/orders";

async function send<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (json?.notInstalled) throw new NotInstalledError(json.error);
    throw new OrderApiError(
      json?.error || `Erreur ${response.status}`,
      response.status,
      typeof json?.field === "string" ? json.field : undefined,
    );
  }
  return json as T;
}

const retryUnlessFinal = (count: number, error: unknown) =>
  !(error instanceof NotInstalledError) &&
  !(error instanceof OrderApiError && error.status < 500) &&
  count < 2;

export function useSales() {
  return useQuery({
    queryKey: SALES_KEY,
    queryFn: () => send<{ sales: SaleListItem[] }>(`${BASE}/sales`, "GET"),
    retry: retryUnlessFinal,
  });
}

export function useSale(saleId: string | undefined) {
  return useQuery({
    queryKey: saleKey(saleId ?? ""),
    queryFn: () => send<SaleDetail>(`${BASE}/sales/${saleId}`, "GET"),
    enabled: !!saleId,
    retry: retryUnlessFinal,
  });
}

/**
 * The superadmins who can drive a round, each with the round their next add
 * would join, and who the caller is. A round changes under the page (the app
 * marks stops delivered), so it is read again at every opening.
 */
export function useDrivers(enabled: boolean) {
  return useQuery({
    queryKey: DRIVERS_KEY,
    queryFn: () =>
      send<{ drivers: Driver[]; me: string }>(`${BASE}/drivers`, "GET"),
    enabled,
    staleTime: 0,
    retry: retryUnlessFinal,
  });
}

/** Refreshes the sale page and the list after any write. */
function useRefresh(saleId?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: SALES_KEY });
    if (saleId) queryClient.invalidateQueries({ queryKey: saleKey(saleId) });
  };
}

export type CreateSaleBody = SaleInput & { copy_from?: string | null };

export function useCreateSale() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (body: CreateSaleBody) =>
      send<{ id: string }>(`${BASE}/sales`, "POST", body),
    onSuccess: refresh,
  });
}

export function useUpdateSale(saleId: string) {
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: (body: SaleInput | { archived: boolean }) =>
      send<Sale>(`${BASE}/sales/${saleId}`, "PATCH", body),
    onSuccess: refresh,
  });
}

export function useDeleteSale() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (saleId: string) =>
      send<{ ok: true }>(`${BASE}/sales/${saleId}`, "DELETE"),
    onSuccess: refresh,
  });
}

export function useSaveProduct(saleId: string) {
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: ({
      productId,
      ...body
    }: Partial<ProductInput> & { productId?: string }) =>
      productId
        ? send<SaleProduct>(
            `${BASE}/sales/${saleId}/products/${productId}`,
            "PATCH",
            body,
          )
        : send<SaleProduct>(`${BASE}/sales/${saleId}/products`, "POST", body),
    onSuccess: refresh,
  });
}

export function useDeleteProduct(saleId: string) {
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: (productId: string) =>
      send<{ ok: true }>(
        `${BASE}/sales/${saleId}/products/${productId}`,
        "DELETE",
      ),
    onSuccess: refresh,
  });
}

export function useReorderProducts(saleId: string) {
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: (ids: string[]) =>
      send<{ ok: true }>(`${BASE}/sales/${saleId}/products`, "PUT", { ids }),
    onSuccess: refresh,
  });
}

/** Creates (no `orderId`) or replaces one order through `save_order`. */
export function useSaveOrder(saleId: string) {
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
            `${BASE}/sales/${saleId}/orders/${orderId}`,
            "PUT",
            body,
          )
        : send<{ id: string }>(`${BASE}/sales/${saleId}/orders`, "POST", body),
    onSuccess: refresh,
  });
}

export function useSetHandedOver(saleId: string) {
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: ({
      orderId,
      handedOver,
    }: {
      orderId: string;
      handedOver: boolean;
    }) =>
      send<{ id: string; handed_over_at: string | null }>(
        `${BASE}/sales/${saleId}/orders/${orderId}`,
        "PATCH",
        { handed_over: handedOver },
      ),
    onSuccess: refresh,
  });
}

export function useDeleteOrder(saleId: string) {
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: (orderId: string) =>
      send<{ ok: true }>(`${BASE}/sales/${saleId}/orders/${orderId}`, "DELETE"),
    onSuccess: refresh,
  });
}

export function useAddPayment(saleId: string) {
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: ({ orderId, ...body }: PaymentBody & { orderId: string }) =>
      send<OrderPayment>(
        `${BASE}/sales/${saleId}/orders/${orderId}/payments`,
        "POST",
        body,
      ),
    onSuccess: refresh,
  });
}

export function useDeletePayment(saleId: string) {
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
        `${BASE}/sales/${saleId}/orders/${orderId}/payments/${paymentId}`,
        "DELETE",
      ),
    onSuccess: refresh,
  });
}

/** Adds the sale's buyers (all, or the chosen `orderIds`) to the driver's round, or to a new one (`newRound`). */
export function useAddSaleToDelivery(saleId: string) {
  const queryClient = useQueryClient();
  const refresh = useRefresh(saleId);
  return useMutation({
    mutationFn: ({
      driverId,
      newRound = false,
      orderIds = null,
    }: {
      driverId: string | null;
      newRound?: boolean;
      /** The orders to add; null adds every buyer to be delivered. */
      orderIds?: string[] | null;
    }) =>
      send<DeliveryResult>(`${BASE}/sales/${saleId}/delivery`, "POST", {
        ...(driverId ? { driver_id: driverId } : {}),
        ...(newRound ? { new_round: true } : {}),
        ...(orderIds ? { order_ids: orderIds } : {}),
      }),
    // Also after a failure: an add of chosen buyers may have added some.
    onSettled: () => {
      refresh();
      // The driver's round has the new stops (and may be a new round).
      queryClient.invalidateQueries({ queryKey: DRIVERS_KEY });
    },
  });
}

"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { BuyersList } from "@/components/orders/BuyersList";
import { OrderDialog } from "@/components/orders/OrderDialog";
import { PaymentDialog } from "@/components/orders/PaymentDialog";
import { SaleFigures } from "@/components/orders/SaleFigures";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import {
  DataState,
  EmptyState,
  LoadingRegion,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NotInstalledError } from "@/hooks/useDocuments";
import {
  OrderApiError,
  useSellerAddPayment,
  useSellerDeleteOrder,
  useSellerDeletePayment,
  useSellerSale,
  useSellerSaveOrder,
} from "@/hooks/useSellerOrders";
import type { OrderPayment } from "@/utils/orders/types";
import {
  filterBuyers,
  NO_BUYER_FILTERS,
  paymentDeletionText,
  saleDatesLine,
  saleView,
} from "@/utils/orders/view";
import RouteNames from "@/utils/routes";
import { heldLine, sellerTotals } from "@repo/domain/utils/orders";
import { ArrowLeft, Banknote, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Deleting =
  | { type: "order"; id: string; name: string }
  | {
      type: "payment";
      orderId: string;
      payment: OrderPayment;
      buyerName: string;
      dueCents: number;
    };

const describe = (error: unknown) =>
  error instanceof Error ? error.message : undefined;

/**
 * « Mes ventes » for one sale: the seller's own figures, what they hold for
 * the treasurer, and their buyers, with « Ajouter un acheteur » and
 * « Encaisser ». The same dialogs as the superadmins' sale page, without
 * the catalogue, the rounds, the other sellers or the members' data.
 */
export default function SellerSalePage() {
  const { saleId } = useParams<{ saleId: string }>();
  const query = useSellerSale(saleId);
  const detail = query.data;

  const saveOrder = useSellerSaveOrder(saleId);
  const deleteOrder = useSellerDeleteOrder(saleId);
  const addPayment = useSellerAddPayment(saleId);
  const deletePayment = useSellerDeletePayment(saleId);

  const [search, setSearch] = useState("");
  const [orderDialog, setOrderDialog] = useState<{
    open: boolean;
    orderId: string | null;
  }>({ open: false, orderId: null });
  const [payment, setPayment] = useState<{
    open: boolean;
    orderId: string | null;
  }>({ open: false, orderId: null });
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const me = detail?.saleSellers[0] ?? null;
  const view = useMemo(() => (detail ? saleView(detail) : null), [detail]);
  const mine = useMemo(
    () =>
      detail && me
        ? (sellerTotals(detail.products, detail.orders, [me])[0] ?? null)
        : null,
    [detail, me],
  );
  const held = mine ? heldLine(mine) : null;
  const visibleRows = useMemo(
    () =>
      view
        ? filterBuyers(view.rows, { ...NO_BUYER_FILTERS, query: search })
        : [],
    [view, search],
  );

  const editingOrder =
    detail?.orders.find((o) => o.id === orderDialog.orderId) ?? null;
  const payingRow =
    view?.rows.find((r) => r.orderId === payment.orderId) ?? null;

  const openOrder = (orderId: string | null) =>
    setOrderDialog({ open: true, orderId });

  const submitOrder = async (
    body: Parameters<typeof saveOrder.mutateAsync>[0],
  ) => {
    const editing = orderDialog.orderId ?? undefined;
    await saveOrder.mutateAsync({ ...body, orderId: editing });
    toast.success(
      editing
        ? `Commande de « ${body.buyer_name} » enregistrée`
        : `« ${body.buyer_name} » ajouté à vos acheteurs`,
    );
  };

  const submitPayment = async (
    body: Parameters<typeof addPayment.mutateAsync>[0] extends infer T
      ? Omit<T, "orderId">
      : never,
  ) => {
    if (!payment.orderId) return;
    await addPayment.mutateAsync({ ...body, orderId: payment.orderId });
    toast.success("Paiement enregistré");
  };

  // Only a payment the seller noted can be removed here; one a superadmin
  // noted stays (the database refuses it too).
  const askDeletePayment = (orderId: string, paymentId: string) => {
    const row = view?.rows.find((r) => r.orderId === orderId);
    const found = row?.order.payments.find((p) => p.id === paymentId);
    if (!row || !found) return;
    if (found.recorded_by !== me) {
      toast.error("Ce paiement a été noté par un superadmin", {
        description: "Demandez-lui de le corriger s'il y a une erreur.",
      });
      return;
    }
    setDeleting({
      type: "payment",
      orderId,
      payment: found,
      buyerName: row.buyerName,
      dueCents: row.dueCents,
    });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      if (deleting.type === "order") {
        await deleteOrder.mutateAsync(deleting.id);
        toast.success(`Commande de « ${deleting.name} » supprimée`);
      } else {
        await deletePayment.mutateAsync({
          orderId: deleting.orderId,
          paymentId: deleting.payment.id,
        });
        toast.success("Paiement supprimé");
      }
      setDeleting(null);
    } catch (error) {
      toast.error(
        deleting.type === "payment"
          ? "Le paiement n'a pas été supprimé"
          : "La suppression a échoué",
        { description: describe(error) },
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const paymentText =
    deleting?.type === "payment"
      ? paymentDeletionText(deleting, deleting.payment)
      : null;

  if (query.error instanceof NotInstalledError) {
    return (
      <PageShell title="Mes ventes">
        <Callout tone="warning" title="Pas encore installé">
          {query.error.message}
        </Callout>
      </PageShell>
    );
  }
  if (
    query.error instanceof OrderApiError &&
    (query.error.status === 403 || query.error.status === 404)
  ) {
    return (
      <PageShell title="Vente introuvable">
        <EmptyState
          icon={Users}
          title="Vous ne vendez pas pour cette vente"
          description="Elle est peut-être terminée, ou un superadmin vous en a retiré. Retrouvez vos ventes en cours dans « Mes ventes »."
          action={
            <Button variant="outline" asChild>
              <Link href={RouteNames.SELLER.ROOT}>
                <ArrowLeft aria-hidden />
                Mes ventes
              </Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  const sale = detail?.sale;

  return (
    <PageShell
      title={sale?.title ?? "Mes ventes"}
      description={sale ? (saleDatesLine(sale) ?? undefined) : undefined}
      headerAction={
        detail && (
          <Button onClick={() => openOrder(null)}>
            <Plus aria-hidden />
            Ajouter un acheteur
          </Button>
        )
      }
    >
      <DataState
        isLoading={query.isLoading}
        isError={query.isError && !detail}
        isEmpty={false}
        onRetry={() => query.refetch()}
        errorDescription="Vos acheteurs n'ont pas pu être chargés."
        skeleton={
          <LoadingRegion label="Chargement de vos acheteurs…">
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-lg" />
            </div>
          </LoadingRegion>
        }
      >
        {detail && view && (
          <div className="space-y-6">
            <Callout tone="info" title="Vous vendez pour cette vente">
              Vous voyez seulement les acheteurs que vous avez notés, et les
              superadmins voient tout ce que vous notez ici.
            </Callout>

            <SaleFigures summary={view.summary} seller />

            {held && (
              <Callout
                tone="warning"
                icon={Banknote}
                title="À remettre au trésorier"
              >
                {held}, que vous avez encaissés. Les virements arrivent
                directement sur le compte de l&apos;association.
              </Callout>
            )}

            <Card className="overflow-hidden p-0">
              <section aria-labelledby="my-buyers-heading">
                <div className="flex flex-col gap-4 p-4 lg:px-6 lg:pt-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2
                      id="my-buyers-heading"
                      className="text-[17px] leading-6 font-semibold"
                    >
                      Mes acheteurs
                    </h2>
                    {view.rows.length > 0 && (
                      <p
                        className="text-note text-muted-foreground"
                        aria-live="polite"
                      >
                        {search.trim()
                          ? `${visibleRows.length} sur ${view.rows.length}`
                          : view.rows.length === 1
                            ? "1 acheteur"
                            : `${view.rows.length} acheteurs`}
                      </p>
                    )}
                  </div>
                  {view.rows.length > 0 && (
                    <form
                      role="search"
                      aria-label="Rechercher parmi mes acheteurs"
                      onSubmit={(event) => event.preventDefault()}
                      className="relative"
                    >
                      <label htmlFor="my-buyer-search" className="sr-only">
                        Rechercher un acheteur
                      </label>
                      <Search
                        aria-hidden
                        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
                      />
                      <Input
                        id="my-buyer-search"
                        type="search"
                        autoComplete="off"
                        placeholder="Nom ou téléphone"
                        className="pl-11"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </form>
                  )}
                </div>
                <div className="border-border border-t">
                  {view.rows.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="Pas encore d'acheteur"
                      description="Notez chaque personne à qui vous vendez : son nom, son téléphone, ce qu'elle commande, et si elle a déjà payé."
                      className="py-8"
                      action={
                        <Button
                          variant="outline"
                          onClick={() => openOrder(null)}
                        >
                          <Plus aria-hidden />
                          Ajouter un acheteur
                        </Button>
                      }
                    />
                  ) : visibleRows.length === 0 ? (
                    <EmptyState
                      icon={Search}
                      title="Aucun acheteur ne correspond"
                      description="Essayez un autre nom ou un autre numéro."
                      className="py-8"
                      action={
                        <Button variant="outline" onClick={() => setSearch("")}>
                          Effacer la recherche
                        </Button>
                      }
                    />
                  ) : (
                    <BuyersList
                      rows={visibleRows}
                      showSoldBy={false}
                      payButton
                      busyOrderId={
                        deleteOrder.isPending
                          ? (deleteOrder.variables ?? null)
                          : null
                      }
                      onEdit={(row) => openOrder(row.orderId)}
                      onPay={(row) =>
                        setPayment({ open: true, orderId: row.orderId })
                      }
                      onDelete={(row) =>
                        setDeleting({
                          type: "order",
                          id: row.orderId,
                          name: row.buyerName,
                        })
                      }
                    />
                  )}
                </div>
              </section>
            </Card>
          </div>
        )}
      </DataState>

      {detail && (
        <>
          <OrderDialog
            variant="seller"
            open={orderDialog.open}
            onOpenChange={(open) =>
              setOrderDialog((current) => ({ ...current, open }))
            }
            order={editingOrder}
            products={detail.products}
            members={[]}
            onSubmit={(body) => submitOrder(body)}
            isPending={saveOrder.isPending}
            onPay={
              editingOrder
                ? () => setPayment({ open: true, orderId: editingOrder.id })
                : undefined
            }
            onDeletePayment={
              editingOrder
                ? (paymentId) => askDeletePayment(editingOrder.id, paymentId)
                : undefined
            }
            deletingPaymentId={
              deletePayment.isPending
                ? (deletePayment.variables?.paymentId ?? null)
                : null
            }
          />

          <PaymentDialog
            open={payment.open}
            onOpenChange={(open) =>
              setPayment((current) => ({ ...current, open }))
            }
            buyerName={payingRow?.buyerName ?? ""}
            dueCents={payingRow?.dueCents ?? 0}
            onSubmit={submitPayment}
            isPending={addPayment.isPending}
          />

          <DeleteConfirmDialog
            open={deleting !== null}
            onOpenChange={(open) => {
              if (!open && !isDeleting) setDeleting(null);
            }}
            onConfirm={confirmDelete}
            title={
              deleting?.type === "order"
                ? `Supprimer la commande de « ${deleting.name} » ?`
                : (paymentText?.title ?? "")
            }
            description={
              deleting?.type === "order"
                ? "Ses quantités et ses paiements sont effacés. Cette action ne peut pas être annulée."
                : (paymentText?.description ?? "")
            }
            isLoading={isDeleting}
          />
        </>
      )}
    </PageShell>
  );
}

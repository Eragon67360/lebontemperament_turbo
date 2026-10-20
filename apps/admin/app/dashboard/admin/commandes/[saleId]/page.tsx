"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { BuyersList } from "@/components/orders/BuyersList";
import { CatalogueSection } from "@/components/orders/CatalogueSection";
import { DeliveryDialog } from "@/components/orders/DeliveryDialog";
import { OrderDialog } from "@/components/orders/OrderDialog";
import { PaymentDialog } from "@/components/orders/PaymentDialog";
import { ProductDialog } from "@/components/orders/ProductDialog";
import { SaleDialog } from "@/components/orders/SaleDialog";
import { SaleFigures } from "@/components/orders/SaleFigures";
import { SuppliersSection } from "@/components/orders/SuppliersSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import {
  DataState,
  EmptyState,
  LoadingRegion,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotInstalledError } from "@/hooks/useDocuments";
import {
  OrderApiError,
  useAddPayment,
  useAddSaleToDelivery,
  useDeleteOrder,
  useDeletePayment,
  useDeleteProduct,
  useDeleteSale,
  useDrivers,
  useReorderProducts,
  useSale,
  useSaveOrder,
  useSaveProduct,
  useSetHandedOver,
  useUpdateSale,
} from "@/hooks/useOrders";
import { useUsers } from "@/hooks/useUsers";
import { memberName } from "@/utils/members/list";
import type { SaleProduct } from "@/utils/orders/types";
import {
  type BuyerFilters,
  deliverableBuyers,
  filterBuyers,
  hasBuyerFilters,
  MODE_FILTERS,
  type ModeFilter,
  NO_BUYER_FILTERS,
  saleDatesLine,
  saleView,
  STATE_FILTERS,
  type StateFilter,
} from "@/utils/orders/view";
import { saleWorkbook, XLSX_MIME, xlsxFilename } from "@/utils/orders/workbook";
import RouteNames from "@/utils/routes";
import {
  groupProductsByCategory,
  productLabel,
} from "@repo/domain/utils/orders";
import {
  ArrowLeft,
  Download,
  Pencil,
  Plus,
  Search,
  ShoppingBasket,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Tab = "buyers" | "suppliers" | "catalogue";

type Deleting =
  | { type: "order"; id: string; name: string }
  | { type: "product"; product: SaleProduct }
  | { type: "sale" };

const describe = (error: unknown) =>
  error instanceof Error ? error.message : undefined;

export default function SalePage() {
  const params = useParams<{ saleId: string }>();
  const saleId = params.saleId;
  const router = useRouter();

  const query = useSale(saleId);
  const detail = query.data;
  const users = useUsers();

  const saveOrder = useSaveOrder(saleId);
  const setHandedOver = useSetHandedOver(saleId);
  const deleteOrder = useDeleteOrder(saleId);
  const addPayment = useAddPayment(saleId);
  const deletePayment = useDeletePayment(saleId);
  const saveProduct = useSaveProduct(saleId);
  const deleteProduct = useDeleteProduct(saleId);
  const reorderProducts = useReorderProducts(saleId);
  const updateSale = useUpdateSale(saleId);
  const deleteSale = useDeleteSale();
  const addToDelivery = useAddSaleToDelivery(saleId);

  const [tab, setTab] = useState<Tab>("buyers");
  const [filters, setFilters] = useState<BuyerFilters>(NO_BUYER_FILTERS);
  const [orderDialog, setOrderDialog] = useState<{
    open: boolean;
    orderId: string | null;
  }>({ open: false, orderId: null });
  const [payment, setPayment] = useState<{
    open: boolean;
    orderId: string | null;
  }>({ open: false, orderId: null });
  const [productDialog, setProductDialog] = useState<{
    open: boolean;
    product: SaleProduct | null;
    category?: string;
  }>({ open: false, product: null });
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  // « Ajouter à la tournée », for every buyer or one row's (`only`).
  const [delivery, setDelivery] = useState<{
    open: boolean;
    only: string | null;
  }>({ open: false, only: null });
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [orderedProduct, setOrderedProduct] = useState<SaleProduct | null>(
    null,
  );
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  const drivers = useDrivers(delivery.open);

  const view = useMemo(() => (detail ? saleView(detail) : null), [detail]);
  const visibleRows = useMemo(
    () => (view ? filterBuyers(view.rows, filters) : []),
    [view, filters],
  );
  const members = useMemo(
    () =>
      (users.data ?? [])
        .map((u) => ({ id: u.id, name: memberName(u) }))
        .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [users.data],
  );
  const orderedQuantities = useMemo(
    () =>
      new Map(
        (view?.summary.products ?? []).map((p) => [p.productId, p.quantity]),
      ),
    [view],
  );
  const categories = useMemo(
    () => [...new Set((detail?.products ?? []).map((p) => p.category))],
    [detail],
  );
  const suppliers = useMemo(
    () =>
      [
        ...new Set(
          (detail?.products ?? [])
            .map((p) => p.supplier?.trim())
            .filter((s): s is string => !!s),
        ),
      ].sort((a, b) => a.localeCompare(b, "fr")),
    [detail],
  );
  const deliverable = useMemo(
    () => deliverableBuyers(detail?.orders ?? []),
    [detail],
  );

  // The dialogs read the order from the latest data, so a payment recorded
  // while the order dialog is open shows up in it.
  const editingOrder =
    detail?.orders.find((o) => o.id === orderDialog.orderId) ?? null;
  const payingRow =
    view?.rows.find((r) => r.orderId === payment.orderId) ?? null;

  // --- Orders ---

  const openOrder = (orderId: string | null) =>
    setOrderDialog({ open: true, orderId });

  const submitOrder = async (
    body: Parameters<typeof saveOrder.mutateAsync>[0],
  ) => {
    const orderId = orderDialog.orderId ?? undefined;
    await saveOrder.mutateAsync({ ...body, orderId });
    toast.success(
      orderId
        ? `Commande de « ${body.buyer_name} » enregistrée`
        : `Commande de « ${body.buyer_name} » ajoutée`,
    );
  };

  const handOver = async (
    orderId: string,
    name: string,
    handedOver: boolean,
  ) => {
    setBusyOrderId(orderId);
    try {
      await setHandedOver.mutateAsync({ orderId, handedOver });
      toast.success(
        handedOver
          ? `Commande de « ${name} » remise`
          : `Remise de « ${name} » annulée`,
      );
    } catch (error) {
      toast.error("La commande n'a pas été mise à jour", {
        description: describe(error),
      });
    } finally {
      setBusyOrderId(null);
    }
  };

  // --- Payments ---

  const submitPayment = async (
    body: Parameters<typeof addPayment.mutateAsync>[0] extends infer T
      ? Omit<T, "orderId">
      : never,
  ) => {
    if (!payment.orderId) return;
    await addPayment.mutateAsync({ ...body, orderId: payment.orderId });
    toast.success("Paiement enregistré");
  };

  const removePayment = async (orderId: string, paymentId: string) => {
    try {
      await deletePayment.mutateAsync({ orderId, paymentId });
      toast.success("Paiement supprimé");
    } catch (error) {
      toast.error("Le paiement n'a pas été supprimé", {
        description: describe(error),
      });
    }
  };

  // --- Catalogue ---

  const submitProduct = async (
    body: Parameters<typeof saveProduct.mutateAsync>[0],
  ) => {
    const productId = productDialog.product?.id;
    await saveProduct.mutateAsync({ ...body, productId });
    toast.success(
      productId ? `« ${body.name} » enregistré` : `« ${body.name} » ajouté`,
    );
  };

  const toggleAvailable = async (product: SaleProduct, available: boolean) => {
    setBusyProductId(product.id);
    try {
      await saveProduct.mutateAsync({
        productId: product.id,
        is_available: available,
      });
      toast.success(
        available
          ? `« ${productLabel(product)} » de nouveau proposé`
          : `« ${productLabel(product)} » n'est plus proposé`,
      );
    } catch (error) {
      toast.error("Le produit n'a pas été mis à jour", {
        description: describe(error),
      });
    } finally {
      setBusyProductId(null);
    }
  };

  const moveProduct = async (
    product: SaleProduct,
    direction: "up" | "down",
  ) => {
    if (!detail) return;
    const ids = groupProductsByCategory(detail.products)
      .flatMap((g) => g.products)
      .map((p) => p.id);
    const index = ids.indexOf(product.id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    setBusyProductId(product.id);
    try {
      await reorderProducts.mutateAsync(ids);
    } catch (error) {
      toast.error("L'ordre n'a pas été enregistré", {
        description: describe(error),
      });
    } finally {
      setBusyProductId(null);
    }
  };

  const askDeleteProduct = (product: SaleProduct) => {
    if ((orderedQuantities.get(product.id) ?? 0) > 0) {
      setOrderedProduct(product);
    } else {
      setDeleting({ type: "product", product });
    }
  };

  // --- Sale ---

  const submitSale = async (
    body: Parameters<typeof updateSale.mutateAsync>[0],
  ) => {
    await updateSale.mutateAsync(body);
    toast.success("Vente enregistrée");
  };

  const toggleArchived = async (archived: boolean) => {
    try {
      await updateSale.mutateAsync({ archived });
      toast.success(archived ? "Vente archivée" : "Vente remise en cours");
    } catch (error) {
      toast.error("La vente n'a pas été mise à jour", {
        description: describe(error),
      });
    }
  };

  const exportXlsx = async () => {
    if (!detail) return;
    setExporting(true);
    try {
      // Loaded on click: the library stays out of the page's bundle.
      const { default: writeExcelFile } =
        await import("write-excel-file/universal");
      const blob = await writeExcelFile(saleWorkbook(detail), {
        fontFamily: "Calibri",
        fontSize: 11,
      }).toBlob();
      const url = URL.createObjectURL(new Blob([blob], { type: XLSX_MIME }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = xlsxFilename(detail.sale.title);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé", {
        description: "Résumé, acheteurs, détail, fournisseurs et paiements.",
      });
    } catch (error) {
      toast.error("L'export n'a pas pu être créé", {
        description: describe(error),
      });
    } finally {
      setExporting(false);
    }
  };

  // --- Deletion ---

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      if (deleting.type === "order") {
        await deleteOrder.mutateAsync(deleting.id);
        toast.success(`Commande de « ${deleting.name} » supprimée`);
      } else if (deleting.type === "product") {
        await deleteProduct.mutateAsync(deleting.product.id);
        toast.success(`« ${productLabel(deleting.product)} » supprimé`);
      } else {
        await deleteSale.mutateAsync(saleId);
        toast.success("Vente supprimée");
        router.push(RouteNames.DASHBOARD.ADMIN.ORDERS);
      }
      setDeleting(null);
    } catch (error) {
      if (
        deleting.type === "product" &&
        error instanceof OrderApiError &&
        error.status === 409
      ) {
        setDeleting(null);
        setOrderedProduct(deleting.product);
      } else {
        toast.error("La suppression a échoué", {
          description: describe(error),
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteTitle =
    deleting?.type === "order"
      ? `Supprimer la commande de « ${deleting.name} » ?`
      : deleting?.type === "product"
        ? `Supprimer « ${productLabel(deleting.product)} » ?`
        : `Supprimer la vente « ${detail?.sale.title ?? ""} » ?`;
  const deleteDescription =
    deleting?.type === "order"
      ? "Ses quantités et ses paiements sont effacés. Si l'acheteur est déjà dans une tournée, son arrêt y reste. Cette action ne peut pas être annulée."
      : deleting?.type === "product"
        ? "Le produit disparaît du catalogue de cette vente. Cette action ne peut pas être annulée."
        : "Le catalogue, toutes les commandes et tous les paiements de cette vente sont effacés. Cette action ne peut pas être annulée.";

  // --- States ---

  if (query.error instanceof NotInstalledError) {
    return (
      <PageShell className="py-4 sm:py-6" title="Commandes">
        <Callout tone="warning" title="Pas encore installé">
          {query.error.message}
        </Callout>
      </PageShell>
    );
  }
  if (query.error instanceof OrderApiError && query.error.status === 404) {
    return (
      <PageShell className="py-4 sm:py-6" title="Vente introuvable">
        <EmptyState
          icon={ShoppingBasket}
          title="Cette vente n'existe pas ou plus"
          description="Elle a peut-être été supprimée. Retrouvez les ventes dans « Commandes »."
          action={
            <Button variant="outline" asChild>
              <Link href={RouteNames.DASHBOARD.ADMIN.ORDERS}>
                <ArrowLeft aria-hidden />
                Toutes les ventes
              </Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  const sale = detail?.sale;
  const dates = sale ? saleDatesLine(sale) : null;
  const filtered = hasBuyerFilters(filters);
  const update = (patch: Partial<BuyerFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));

  return (
    <PageShell
      className="py-4 sm:py-6"
      title={sale?.title ?? "Vente"}
      description={
        sale && (
          <span className="flex flex-wrap items-center gap-2">
            {dates ?? "Dates à préciser dans « Catalogue »."}
            {sale.archived_at && (
              <StatusBadge tone="neutral" dot={false}>
                Archivée
              </StatusBadge>
            )}
          </span>
        )
      }
      headerAction={
        detail && (
          <>
            <Button
              variant="outline"
              onClick={() => setDelivery({ open: true, only: null })}
            >
              <Truck aria-hidden />
              Ajouter à la tournée
            </Button>
            <Button
              variant="outline"
              onClick={exportXlsx}
              disabled={detail.orders.length === 0 || exporting}
            >
              <Download aria-hidden />
              Exporter (Excel)
            </Button>
            <Button onClick={() => openOrder(null)}>
              <Plus aria-hidden />
              Ajouter une commande
            </Button>
          </>
        )
      }
    >
      <DataState
        isLoading={query.isLoading}
        isError={query.isError && !detail}
        isEmpty={false}
        onRetry={() => query.refetch()}
        errorDescription={
          query.error instanceof OrderApiError && query.error.status === 403
            ? "Cette page est réservée aux superadmins."
            : "La vente n'a pas pu être chargée."
        }
        skeleton={
          <LoadingRegion label="Chargement de la vente…">
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-10 w-80 rounded-md" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
          </LoadingRegion>
        }
      >
        {detail && view && (
          <div className="space-y-6">
            <SaleFigures summary={view.summary} />

            <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
              <TabsList
                aria-label="Parties de la vente"
                className="max-w-full overflow-x-auto"
              >
                <TabsTrigger value="buyers">Acheteurs</TabsTrigger>
                <TabsTrigger value="suppliers">
                  {/* The three tabs must fit side by side on a 390 px phone. */}
                  <span className="sm:hidden">Fournisseurs</span>
                  <span className="hidden sm:inline">
                    Produits et fournisseurs
                  </span>
                </TabsTrigger>
                <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
              </TabsList>

              <TabsContent value="buyers" className="mt-5">
                <Card className="overflow-hidden p-0">
                  <section aria-labelledby="buyers-heading">
                    <div className="flex flex-col gap-4 p-4 lg:px-6 lg:pt-5">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h2
                          id="buyers-heading"
                          className="text-[17px] leading-6 font-semibold"
                        >
                          Acheteurs
                        </h2>
                        {view.rows.length > 0 && (
                          <p
                            className="text-note text-muted-foreground"
                            aria-live="polite"
                          >
                            {filtered
                              ? `${visibleRows.length} sur ${view.rows.length}`
                              : view.rows.length === 1
                                ? "1 acheteur"
                                : `${view.rows.length} acheteurs`}
                          </p>
                        )}
                      </div>
                      <form
                        role="search"
                        aria-label="Filtrer les acheteurs"
                        className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center"
                        onSubmit={(event) => event.preventDefault()}
                      >
                        <div className="relative sm:col-span-2 lg:min-w-56 lg:flex-1">
                          <label htmlFor="buyer-search" className="sr-only">
                            Rechercher un acheteur
                          </label>
                          <Search
                            aria-hidden
                            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
                          />
                          <Input
                            id="buyer-search"
                            type="search"
                            autoComplete="off"
                            placeholder="Nom, téléphone, vendeur"
                            className="pl-11"
                            value={filters.query}
                            onChange={(event) =>
                              update({ query: event.target.value })
                            }
                          />
                        </div>
                        <Select
                          value={filters.state}
                          onValueChange={(state) =>
                            update({ state: state as StateFilter })
                          }
                        >
                          <SelectTrigger className="lg:w-44" aria-label="État">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATE_FILTERS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={filters.mode}
                          onValueChange={(mode) =>
                            update({ mode: mode as ModeFilter })
                          }
                        >
                          <SelectTrigger className="lg:w-52" aria-label="Mode">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MODE_FILTERS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </form>
                    </div>
                    <div className="border-border border-t">
                      {view.rows.length === 0 ? (
                        <EmptyState
                          icon={Users}
                          title="Aucune commande pour le moment"
                          description="Saisissez les feuilles de commande une par une : nom, téléphone, adresse et quantités."
                          className="py-8"
                          action={
                            <Button
                              variant="outline"
                              onClick={() => openOrder(null)}
                            >
                              <Plus aria-hidden />
                              Ajouter une commande
                            </Button>
                          }
                        />
                      ) : visibleRows.length === 0 ? (
                        <EmptyState
                          icon={Search}
                          title="Aucun acheteur ne correspond"
                          description="Essayez un autre nom, ou retirez un filtre."
                          className="py-8"
                          action={
                            <Button
                              variant="outline"
                              onClick={() => setFilters(NO_BUYER_FILTERS)}
                            >
                              Effacer les filtres
                            </Button>
                          }
                        />
                      ) : (
                        <BuyersList
                          rows={visibleRows}
                          busyOrderId={busyOrderId}
                          onEdit={(row) => openOrder(row.orderId)}
                          onPay={(row) =>
                            setPayment({ open: true, orderId: row.orderId })
                          }
                          onAddToRound={(row) =>
                            setDelivery({ open: true, only: row.orderId })
                          }
                          onHandOver={(row, handedOver) =>
                            handOver(row.orderId, row.buyerName, handedOver)
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
              </TabsContent>

              <TabsContent value="suppliers" className="mt-5">
                <section
                  aria-labelledby="suppliers-heading"
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <h2 id="suppliers-heading" className="text-section">
                      À commander aux fournisseurs
                    </h2>
                    <p className="text-detail text-muted-foreground">
                      Les quantités de toutes les commandes, produit par
                      produit, telles qu&apos;elles sont à ce jour.
                    </p>
                  </div>
                  <SuppliersSection summary={view.summary} />
                </section>
              </TabsContent>

              <TabsContent value="catalogue" className="mt-5">
                <div className="space-y-8">
                  <section
                    aria-labelledby="catalogue-heading"
                    className="space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-1">
                        <h2 id="catalogue-heading" className="text-section">
                          Catalogue
                        </h2>
                        <p className="text-detail text-muted-foreground">
                          Les produits proposés dans cette vente, avec leur prix
                          et leur fournisseur.
                        </p>
                      </div>
                      {detail.products.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            setProductDialog({ open: true, product: null })
                          }
                        >
                          <Plus aria-hidden />
                          Ajouter un produit
                        </Button>
                      )}
                    </div>
                    <CatalogueSection
                      products={detail.products}
                      orderedQuantities={orderedQuantities}
                      busyProductId={busyProductId}
                      onAdd={(category) =>
                        setProductDialog({
                          open: true,
                          product: null,
                          category,
                        })
                      }
                      onEdit={(product) =>
                        setProductDialog({ open: true, product })
                      }
                      onToggleAvailable={toggleAvailable}
                      onMove={moveProduct}
                      onDelete={askDeleteProduct}
                    />
                  </section>

                  <section aria-labelledby="sale-heading" className="space-y-3">
                    <h2 id="sale-heading" className="text-section">
                      La vente
                    </h2>
                    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium">{sale!.title}</p>
                        <p className="text-detail text-muted-foreground">
                          {dates ?? "Aucune date renseignée."}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setSaleDialogOpen(true)}
                      >
                        <Pencil aria-hidden />
                        Modifier la vente
                      </Button>
                    </Card>
                  </section>

                  <section
                    aria-labelledby="danger-heading"
                    className="space-y-3"
                  >
                    <h2 id="danger-heading" className="text-section">
                      Actions sensibles
                    </h2>
                    <Card className="divide-border divide-y p-0">
                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {sale!.archived_at
                              ? "Remettre la vente en cours"
                              : "Archiver la vente"}
                          </p>
                          <p className="text-detail text-muted-foreground">
                            {sale!.archived_at
                              ? "Elle revient dans les ventes en cours."
                              : "Elle passe dans les ventes archivées ; rien n'est effacé et la prochaine vente pourra repartir de son catalogue."}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => toggleArchived(!sale!.archived_at)}
                          disabled={updateSale.isPending}
                        >
                          {sale!.archived_at
                            ? "Remettre en cours"
                            : "Archiver la vente"}
                        </Button>
                      </div>
                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Supprimer la vente</p>
                          <p className="text-detail text-muted-foreground">
                            Catalogue, commandes et paiements compris. Pour une
                            vente créée par erreur.
                          </p>
                        </div>
                        <Button
                          variant="destructive-outline"
                          onClick={() => setDeleting({ type: "sale" })}
                        >
                          Supprimer la vente…
                        </Button>
                      </div>
                    </Card>
                  </section>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DataState>

      {detail && (
        <>
          <OrderDialog
            open={orderDialog.open}
            onOpenChange={(open) =>
              setOrderDialog((current) => ({ ...current, open }))
            }
            order={editingOrder}
            products={detail.products}
            members={members}
            onSubmit={submitOrder}
            isPending={saveOrder.isPending}
            onPay={
              editingOrder
                ? () => setPayment({ open: true, orderId: editingOrder.id })
                : undefined
            }
            onDeletePayment={
              editingOrder
                ? (paymentId) => removePayment(editingOrder.id, paymentId)
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

          <ProductDialog
            open={productDialog.open}
            onOpenChange={(open) =>
              setProductDialog((current) => ({ ...current, open }))
            }
            product={productDialog.product}
            category={productDialog.category}
            categories={categories}
            suppliers={suppliers}
            onSubmit={submitProduct}
            isPending={saveProduct.isPending}
          />

          <SaleDialog
            open={saleDialogOpen}
            onOpenChange={setSaleDialogOpen}
            sale={detail.sale}
            onSubmit={submitSale}
            isPending={updateSale.isPending}
          />

          <DeliveryDialog
            open={delivery.open}
            onOpenChange={(open) =>
              setDelivery((current) => ({ ...current, open }))
            }
            buyers={deliverable.ready}
            only={delivery.only}
            withoutAddress={deliverable.withoutAddress}
            drivers={drivers.data?.drivers ?? []}
            me={drivers.data?.me ?? null}
            onConfirm={(driverId, newRound, orderIds) =>
              addToDelivery.mutateAsync({ driverId, newRound, orderIds })
            }
            isPending={addToDelivery.isPending}
          />

          <DeleteConfirmDialog
            open={deleting !== null}
            onOpenChange={(open) => {
              if (!open && !isDeleting) setDeleting(null);
            }}
            onConfirm={confirmDelete}
            title={deleteTitle}
            description={deleteDescription}
            isLoading={isDeleting}
          />

          <AlertDialog
            open={orderedProduct !== null}
            onOpenChange={(open) => {
              if (!open) setOrderedProduct(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  « {orderedProduct ? productLabel(orderedProduct) : ""} » est
                  déjà commandé
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {orderedProduct &&
                    `${orderedQuantities.get(orderedProduct.id) ?? 0} exemplaire${
                      (orderedQuantities.get(orderedProduct.id) ?? 0) > 1
                        ? "s"
                        : ""
                    } figurent dans des commandes : le produit ne peut pas être supprimé. Rendez-le indisponible pour qu'il n'apparaisse plus dans les nouvelles commandes ; celles qui l'ont le gardent.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    event.preventDefault();
                    const product = orderedProduct;
                    setOrderedProduct(null);
                    if (product && product.is_available) {
                      void toggleAvailable(product, false);
                    }
                  }}
                  disabled={!orderedProduct?.is_available}
                >
                  {orderedProduct?.is_available
                    ? "Rendre indisponible"
                    : "Déjà indisponible"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </PageShell>
  );
}

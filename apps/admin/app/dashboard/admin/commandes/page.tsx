"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { SaleDialog } from "@/components/orders/SaleDialog";
import { SaleRow } from "@/components/orders/SaleRow";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { NotInstalledError } from "@/hooks/useDocuments";
import { useCreateSale, useSales } from "@/hooks/useOrders";
import RouteNames from "@/utils/routes";
import { ChevronRight, Plus, ShoppingBasket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_TITLE = "Commandes";
const PAGE_DESCRIPTION =
  "Les ventes de l'association, comme celle des fromages et saucissons : qui a commandé quoi, qui a payé, ce qu'il reste à encaisser et ce qu'il faut commander aux fournisseurs.";

export default function OrdersPage() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useSales();
  const createSale = useCreateSale();
  const [dialogOpen, setDialogOpen] = useState(false);

  const sales = useMemo(() => data?.sales ?? [], [data]);
  const active = useMemo(
    () => sales.filter((s) => s.archived_at === null),
    [sales],
  );
  const archived = useMemo(
    () => sales.filter((s) => s.archived_at !== null),
    [sales],
  );

  const create = async (body: Parameters<typeof createSale.mutateAsync>[0]) => {
    const { id } = await createSale.mutateAsync(body);
    toast.success(`« ${body.title} » créée`);
    router.push(RouteNames.DASHBOARD.ADMIN.ORDER_SALE(id));
  };

  if (error instanceof NotInstalledError) {
    return (
      <PageShell
        className="py-4 sm:py-6"
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
      >
        <Callout tone="warning" title="Pas encore installé">
          {error.message}
        </Callout>
      </PageShell>
    );
  }

  return (
    <PageShell
      className="py-4 sm:py-6"
      title={PAGE_TITLE}
      description={PAGE_DESCRIPTION}
      headerAction={
        <Button onClick={() => setDialogOpen(true)}>
          <Plus aria-hidden />
          Nouvelle vente
        </Button>
      }
    >
      <div className="space-y-8">
        <section aria-labelledby="sales-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="sales-heading" className="text-section">
              Ventes en cours
            </h2>
            {active.length > 0 && (
              <p className="text-note text-muted-foreground">
                {active.length} {active.length === 1 ? "vente" : "ventes"}
              </p>
            )}
          </div>
          <DataState
            isLoading={isLoading}
            isError={isError && !data}
            isEmpty={active.length === 0}
            onRetry={() => refetch()}
            errorDescription="Les ventes n'ont pas pu être chargées."
            skeleton={<ListSkeleton rows={2} label="Chargement des ventes…" />}
            empty={
              <EmptyState
                icon={ShoppingBasket}
                title="Aucune vente en cours"
                description={
                  archived.length > 0
                    ? "Les ventes passées sont archivées ci-dessous. Une nouvelle vente peut repartir de leur catalogue."
                    : "Créez la première vente : elle a son catalogue, ses commandes et ses paiements."
                }
                className="py-6"
                action={
                  <Button variant="outline" onClick={() => setDialogOpen(true)}>
                    <Plus aria-hidden />
                    Nouvelle vente
                  </Button>
                }
              />
            }
          >
            <ul className="space-y-3">
              {active.map((sale) => (
                <li key={sale.id} className="list-none">
                  <SaleRow sale={sale} />
                </li>
              ))}
            </ul>
          </DataState>
        </section>

        {archived.length > 0 && (
          <details className="group">
            <summary className="text-primary-text hover:bg-accent flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-md px-2 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
              <ChevronRight
                className="size-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                aria-hidden
              />
              {archived.length === 1
                ? "1 vente archivée"
                : `${archived.length} ventes archivées`}
            </summary>
            <ul className="mt-3 space-y-3">
              {archived.map((sale) => (
                <li key={sale.id} className="list-none">
                  <SaleRow sale={sale} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <SaleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sales={sales.map((s) => ({
          id: s.id,
          title: s.title,
          archived: s.archived_at !== null,
        }))}
        onSubmit={create}
        isPending={createSale.isPending}
      />
    </PageShell>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/data-state";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Switch } from "@/components/ui/switch";
import type { SaleProduct } from "@/utils/orders/types";
import {
  formatEuros,
  groupProductsByCategory,
  productLabel,
} from "@repo/domain/utils/orders";
import { ArrowDown, ArrowUp, Package, Pencil, Plus } from "lucide-react";

export interface CatalogueSectionProps {
  products: readonly SaleProduct[];
  /** How many of each product are ordered, by id (a product ordered can't be deleted). */
  orderedQuantities: ReadonlyMap<string, number>;
  onAdd: (category?: string) => void;
  onEdit: (product: SaleProduct) => void;
  onToggleAvailable: (product: SaleProduct, available: boolean) => void;
  /** Moves the product one place up or down within the catalogue. */
  onMove: (product: SaleProduct, direction: "up" | "down") => void;
  onDelete: (product: SaleProduct) => void;
  /** The id of the product whose write is running: its row waits. */
  busyProductId?: string | null;
}

/**
 * « Catalogue »: the products by category, each with its supplier and
 * price, a switch for new orders, « Modifier », the up and down arrows and
 * the « ⋯ » menu (« Supprimer… »).
 */
export function CatalogueSection({
  products,
  orderedQuantities,
  onAdd,
  onEdit,
  onToggleAvailable,
  onMove,
  onDelete,
  busyProductId,
}: CatalogueSectionProps) {
  const groups = groupProductsByCategory(products);
  // Positions within the whole catalogue, so an arrow can cross a category.
  const ordered = groups.flatMap((g) => g.products);

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Le catalogue est vide"
        description="Ajoutez les produits de la feuille de commande, avec leur prix et leur fournisseur."
        className="py-8"
        action={
          <Button variant="outline" onClick={() => onAdd()}>
            <Plus aria-hidden />
            Ajouter un produit
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const headingId = `catalogue-${group.category
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}`;
        return (
          <Card key={group.category} className="overflow-hidden p-0">
            <section aria-labelledby={headingId}>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-4 pb-3 lg:px-6">
                <h3
                  id={headingId}
                  className="text-[17px] leading-6 font-semibold"
                >
                  {group.category}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAdd(group.category)}
                >
                  <Plus aria-hidden />
                  Ajouter
                  <span className="sr-only">
                    {" "}
                    un produit dans « {group.category} »
                  </span>
                </Button>
              </div>
              <ul className="divide-border border-border divide-y border-t">
                {group.products.map((product) => {
                  const label = productLabel(product);
                  const index = ordered.findIndex((p) => p.id === product.id);
                  const busy = busyProductId === product.id;
                  const ordered_ = orderedQuantities.get(product.id) ?? 0;
                  const switchId = `available-${product.id}`;
                  return (
                    <li
                      key={product.id}
                      className="flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:gap-4 lg:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={
                            product.is_available
                              ? "truncate font-medium"
                              : "text-muted-foreground truncate font-medium"
                          }
                        >
                          {label}
                        </p>
                        <p className="text-note text-muted-foreground truncate">
                          {[
                            formatEuros(product.unit_price_cents),
                            product.supplier,
                            ordered_ > 0 &&
                              `${ordered_} commandé${ordered_ > 1 ? "s" : ""}`,
                            !product.is_available && "plus proposé",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <label
                          htmlFor={switchId}
                          className="text-detail text-muted-foreground mr-1 flex min-h-10 items-center gap-2"
                        >
                          <Switch
                            id={switchId}
                            checked={product.is_available}
                            onCheckedChange={(checked) =>
                              onToggleAvailable(product, checked)
                            }
                            disabled={busy}
                            aria-label={`Disponible : ${label}`}
                          />
                          Disponible
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(product)}
                          disabled={busy}
                        >
                          <Pencil aria-hidden />
                          Modifier
                          <span className="sr-only"> « {label} »</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onMove(product, "up")}
                          disabled={busy || index <= 0}
                        >
                          <ArrowUp aria-hidden />
                          <span className="sr-only">Monter « {label} »</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onMove(product, "down")}
                          disabled={busy || index >= ordered.length - 1}
                        >
                          <ArrowDown aria-hidden />
                          <span className="sr-only">Descendre « {label} »</span>
                        </Button>
                        <RowActionsMenu
                          name={label}
                          onDelete={() => onDelete(product)}
                          disabled={busy}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </Card>
        );
      })}
    </div>
  );
}

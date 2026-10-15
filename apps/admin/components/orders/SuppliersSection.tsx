import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/data-state";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEuros, type SaleSummary } from "@repo/domain/utils/orders";
import { Truck } from "lucide-react";

/**
 * « Produits et fournisseurs »: for each supplier, the quantities to order
 * (product by product) and what they add up to. Products without a supplier
 * are grouped last under « Sans fournisseur ».
 */
export function SuppliersSection({ summary }: { summary: SaleSummary }) {
  if (summary.suppliers.length === 0) {
    return (
      <EmptyState
        icon={Truck}
        title="Rien à commander pour le moment"
        description="Les quantités à commander à chaque fournisseur apparaissent ici dès la première commande."
        className="py-8"
      />
    );
  }
  return (
    <div className="space-y-4">
      {summary.suppliers.map((supplier) => {
        const name = supplier.supplier ?? "Sans fournisseur";
        const headingId = `supplier-${slug(name)}`;
        return (
          <Card key={name} className="overflow-hidden p-0">
            <section aria-labelledby={headingId}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-4 pb-3 lg:px-6">
                <h3
                  id={headingId}
                  className="text-[17px] leading-6 font-semibold"
                >
                  {name}
                </h3>
                <p className="text-note text-muted-foreground">
                  {supplier.quantity}{" "}
                  {supplier.quantity > 1 ? "articles" : "article"} ·{" "}
                  {formatEuros(supplier.amountCents)}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col" className="pl-4 lg:pl-6">
                      Produit
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      Quantité
                    </TableHead>
                    <TableHead scope="col" className="pr-4 text-right lg:pr-6">
                      Montant
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplier.products.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell className="py-2 pl-4 lg:pl-6">
                        <span className="font-medium">{product.label}</span>
                        <span className="text-note text-muted-foreground block">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right tabular-nums">
                        {product.quantity}
                      </TableCell>
                      <TableCell className="py-2 pr-4 text-right tabular-nums lg:pr-6">
                        {formatEuros(product.amountCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="py-2 pl-4 lg:pl-6">Total</TableCell>
                    <TableCell className="py-2 text-right tabular-nums">
                      {supplier.quantity}
                    </TableCell>
                    <TableCell className="py-2 pr-4 text-right tabular-nums lg:pr-6">
                      {formatEuros(supplier.amountCents)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </section>
          </Card>
        );
      })}
    </div>
  );
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

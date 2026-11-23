import { PageShell } from "@/components/layouts/PageShell";
import { Card } from "@/components/ui/card";
import { mySellerSales } from "@/utils/orders/seller";
import { saleDatesLine } from "@/utils/orders/view";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/server";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * The sales the member sells for. With one (the usual case), straight to
 * it; the layout already sent away anyone who sells for none.
 */
export default async function SellerSalesPage() {
  const sales = await mySellerSales(await createClient());
  if (sales.length === 1) redirect(RouteNames.SELLER.SALE(sales[0]!.id));

  return (
    <PageShell
      title="Mes ventes"
      description="Les ventes pour lesquelles vous notez vos acheteurs et leurs paiements."
    >
      <ul className="space-y-3">
        {sales.map((sale) => (
          <li key={sale.id}>
            <Card className="p-0">
              <Link
                href={RouteNames.SELLER.SALE(sale.id)}
                className="hover:bg-muted/50 focus-visible:outline-ring flex min-h-16 items-center gap-3 rounded-[inherit] px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{sale.title}</span>
                  <span className="text-note text-muted-foreground block">
                    {saleDatesLine(sale) ?? "Dates à préciser"}
                  </span>
                </span>
                <ChevronRight
                  className="text-muted-foreground size-5"
                  aria-hidden
                />
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SaleListItem } from "@/utils/orders/types";
import { orderCountLabel, saleDatesLine } from "@/utils/orders/view";
import RouteNames from "@/utils/routes";
import { formatEuros } from "@repo/domain/utils/orders";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * One sale of « Commandes »: its title and dates, how many orders, their
 * total and what is still owed. The whole card opens the sale.
 */
export function SaleRow({
  sale,
  now,
}: {
  sale: SaleListItem;
  /** Injected so renders are stable in tests. */
  now?: Date;
}) {
  const dates = saleDatesLine(sale, now);
  const archived = sale.archived_at !== null;
  return (
    <Card className="hover:bg-accent transition-colors motion-reduce:transition-none">
      <Link
        href={RouteNames.DASHBOARD.ADMIN.ORDER_SALE(sale.id)}
        className="flex min-h-(--row-h) items-center gap-4 rounded-lg p-4"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-body min-w-0 font-semibold break-words">
              {sale.title}
            </h3>
            {archived && (
              <StatusBadge tone="neutral" dot={false}>
                Archivée
              </StatusBadge>
            )}
          </div>
          {dates && <p className="text-note text-muted-foreground">{dates}</p>}
          <p className="text-detail text-muted-foreground">
            {orderCountLabel(sale.orderCount)}
            {sale.orderCount > 0 && (
              <>
                {" · "}
                {formatEuros(sale.totalCents)}
                {sale.dueCents > 0 ? (
                  <>
                    {" · "}
                    <span className="text-warning-foreground font-medium">
                      reste à encaisser {formatEuros(sale.dueCents)}
                    </span>
                  </>
                ) : (
                  <> · tout est encaissé</>
                )}
              </>
            )}
          </p>
        </div>
        <ChevronRight
          className="text-foreground-faint size-5 shrink-0"
          aria-hidden
        />
      </Link>
    </Card>
  );
}

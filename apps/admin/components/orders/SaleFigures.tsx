import { Card } from "@/components/ui/card";
import { orderCountLine } from "@/utils/orders/view";
import {
  formatEuros,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type SaleSummary,
} from "@repo/domain/utils/orders";

/**
 * The sale in four figures: what was ordered, what came in (by method in
 * small text), what is still owed, and how many orders still have to pay.
 */
export function SaleFigures({ summary }: { summary: SaleSummary }) {
  const byMethod = PAYMENT_METHODS.filter((m) => summary.byMethod[m] !== 0)
    .map(
      (m) => `${PAYMENT_METHOD_LABELS[m]} ${formatEuros(summary.byMethod[m])}`,
    )
    .join(" · ");
  const owed = summary.dueCents;
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Figure label="Total commandé" value={formatEuros(summary.totalCents)} />
      <Figure
        label="Encaissé"
        value={formatEuros(summary.paidCents)}
        detail={byMethod || undefined}
      />
      <Figure
        label="Reste à encaisser"
        value={formatEuros(owed)}
        tone={owed > 0 ? "warning" : "default"}
        detail={
          summary.overpaidCents > 0
            ? `dont ${formatEuros(summary.overpaidCents)} trop perçus à rendre`
            : undefined
        }
      />
      <Figure
        label="Commandes"
        value={String(summary.orderCount)}
        detail={orderCountLine(summary)}
      />
    </dl>
  );
}

function Figure({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "warning";
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-1">
        <dt className="text-note text-muted-foreground font-medium">{label}</dt>
        <dd
          className={
            tone === "warning"
              ? "text-warning-foreground text-section tabular-nums"
              : "text-section tabular-nums"
          }
        >
          {value}
        </dd>
        {detail && (
          <dd className="text-note text-muted-foreground">{detail}</dd>
        )}
      </div>
    </Card>
  );
}

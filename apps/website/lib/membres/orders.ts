// « Mes commandes »: the sentences the members area says about an order
// (French, « tu »). The figures come from @repo/domain/utils/memberOrders,
// the same rules as the admin. Pure; tested in orders.test.ts.
import type {
  MemberOrder,
  MemberOrderFigures,
  MemberOrderPayment,
} from "@repo/domain/utils/memberOrders";
import { formatEuros, PAYMENT_METHOD_LABELS } from "@repo/domain/utils/orders";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { parseLocalDate } from "./rehearsals";

/** « vendredi 27 novembre » (the year only when it isn't `now`'s). */
export function dayLabel(iso: string, now = new Date()): string {
  const date = iso.length === 10 ? parseLocalDate(iso) : new Date(iso);
  return format(
    date,
    date.getFullYear() === now.getFullYear()
      ? "EEEE d MMMM"
      : "EEEE d MMMM yyyy",
    { locale: fr },
  );
}

/** « 1 article », « 4 articles ». */
export function articleCountLabel(count: number): string {
  return `${count} article${count > 1 ? "s" : ""}`;
}

/** How the order reaches the member, and when. */
export function handoverLine(order: MemberOrder, now = new Date()): string {
  if (order.deliveredAt) return `Livrée le ${dayLabel(order.deliveredAt, now)}`;
  if (order.handedOverAt) {
    return `Remise le ${dayLabel(order.handedOverAt, now)}`;
  }
  if (order.fulfilment === "pickup") {
    return order.deliveryDate
      ? `À récupérer à partir du ${dayLabel(order.deliveryDate, now)}`
      : "À récupérer auprès de l’association";
  }
  return order.deliveryDate
    ? `Livraison prévue le ${dayLabel(order.deliveryDate, now)}`
    : "Livraison à domicile, date à venir";
}

/** The short state chip. */
export function stageLabel(figures: MemberOrderFigures): string {
  switch (figures.stage) {
    case "delivered":
      return "Livrée";
    case "handed_over":
      return "Remise";
    case "in_round":
      return "Dans la tournée";
    default:
      return "Enregistrée";
  }
}

/** What is left to pay, in one friendly sentence. */
export function balanceLine(figures: MemberOrderFigures): string | null {
  switch (figures.status) {
    case "paid":
      return "Tout est payé, merci !";
    case "partial":
      return `Reste ${formatEuros(figures.dueCents)} à payer`;
    case "unpaid":
      return `${formatEuros(figures.dueCents)} à payer`;
    case "overpaid":
      return `Tu as payé ${formatEuros(-figures.dueCents)} de trop : l’association te les rendra`;
    default:
      return null;
  }
}

/** « 10,00 € par virement, le 23 octobre ». */
export function paymentLine(
  payment: MemberOrderPayment,
  now = new Date(),
): string {
  const how = payment.method
    ? ` ${payment.amountCents < 0 ? "remboursés en" : "par"} ${PAYMENT_METHOD_LABELS[payment.method].toLowerCase()}`
    : "";
  const day = format(
    parseLocalDate(payment.paidOn),
    parseLocalDate(payment.paidOn).getFullYear() === now.getFullYear()
      ? "d MMMM"
      : "d MMMM yyyy",
    { locale: fr },
  );
  return `${formatEuros(Math.abs(payment.amountCents))}${how}, le ${day}`;
}

export type StepState = "done" | "current" | "todo";
export type OrderStep = { label: string; state: StepState; note?: string };

/** Three steps: commandée, payée, livrée (or récupérée). */
export function orderSteps(
  order: MemberOrder,
  figures: MemberOrderFigures,
): OrderStep[] {
  const paid = figures.status === "paid" || figures.status === "overpaid";
  const handed =
    figures.stage === "delivered" || figures.stage === "handed_over";
  return [
    { label: "Commandée", state: "done" },
    {
      label: "Payée",
      state: paid ? "done" : figures.status === "partial" ? "current" : "todo",
      note: figures.status === "partial" ? "en partie" : undefined,
    },
    {
      label: order.fulfilment === "pickup" ? "Récupérée" : "Livrée",
      state: handed
        ? "done"
        : figures.stage === "in_round"
          ? "current"
          : "todo",
      note: figures.stage === "in_round" ? "en tournée" : undefined,
    },
  ];
}

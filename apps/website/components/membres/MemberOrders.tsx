"use client";

import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import {
  downloadOrderDocument,
  useMemberOrders,
} from "@/hooks/useMemberOrders";
import {
  articleCountLabel,
  balanceLine,
  handoverLine,
  type OrderStep,
  orderSteps,
  paymentLine,
  stageLabel,
} from "@/lib/membres/orders";
import {
  type MemberOrder,
  memberOrderFigures,
} from "@repo/domain/utils/memberOrders";
import { orderDocumentDetails } from "@repo/domain/utils/orderDocuments";
import { formatEuros } from "@repo/domain/utils/orders";
import { useState } from "react";
import {
  IoBagHandleOutline,
  IoCheckmark,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoLocationOutline,
  IoNavigateOutline,
} from "react-icons/io5";
import { membersButtonClass, MembersLinkButton } from "./MembersButton";
import { MembersCard } from "./MembersCard";
import { PageHeader } from "./PageHeader";

/** Three dots joined by a line: commandée, payée, livrée. */
function Steps({ steps }: { steps: OrderStep[] }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Où en est ta commande">
      {steps.map((step, i) => (
        <li key={step.label} className="flex flex-col gap-2">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                step.state === "done"
                  ? "bg-members-ink border-members-ink text-members-ink-foreground"
                  : step.state === "current"
                    ? "border-members-ink bg-members-card text-foreground"
                    : "border-members-line bg-members-card text-members-muted"
              }`}
            >
              {step.state === "done" ? (
                <IoCheckmark className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{i + 1}</span>
              )}
            </span>
            {i < steps.length - 1 && (
              <span
                className={`h-0.5 flex-1 rounded-full ${
                  step.state === "done" ? "bg-members-ink" : "bg-members-line"
                }`}
              />
            )}
          </div>
          <span className="text-base leading-tight">
            <span
              className={
                step.state === "todo" ? "text-members-muted" : "font-medium"
              }
            >
              {step.label}
            </span>
            {step.note && (
              <span className="text-members-muted block text-sm">
                {step.note}
              </span>
            )}
            <span className="sr-only">
              {step.state === "done"
                ? " : fait"
                : step.state === "current"
                  ? " : en cours"
                  : " : à venir"}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function DocumentButton({
  document,
}: {
  document: NonNullable<MemberOrder["document"]>;
}) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        className={membersButtonClass("outline", "self-start", "md")}
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          setState((await downloadOrderDocument(document)) ? "idle" : "failed");
        }}
      >
        <IoDownloadOutline aria-hidden="true" className="h-5 w-5" />
        {state === "busy" ? "Ouverture…" : "Télécharger mon bon de commande"}
      </button>
      <span className="text-members-muted text-base">
        {orderDocumentDetails({
          mime_type: document.mimeType,
          size_bytes: document.sizeBytes,
        })}
      </span>
      {state === "failed" && (
        <p role="alert" className="text-base">
          Le bon de commande n’a pas pu être ouvert. Réessaie dans un instant.
        </p>
      )}
    </div>
  );
}

/** One order: the steps, what was ordered, the money, the order form. */
export function OrderCard({ order }: { order: MemberOrder }) {
  const figures = memberOrderFigures(order);
  const headingId = `commande-${order.id}`;
  const balance = balanceLine(figures);
  return (
    <MembersCard
      as="article"
      aria-labelledby={headingId}
      className="flex flex-col gap-6 p-5 sm:p-8"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-members-band rounded-full px-3.5 py-1 text-base font-medium">
            {stageLabel(figures)}
          </span>
          <span className="text-members-muted text-base">
            {articleCountLabel(figures.articleCount)} ·{" "}
            {formatEuros(figures.totalCents)}
          </span>
        </div>
        <h2
          id={headingId}
          className="font-members-display text-[26px] leading-tight font-semibold sm:text-[30px]"
        >
          {order.saleTitle}
        </h2>
        <p className="font-medium first-letter:uppercase">
          {handoverLine(order)}
        </p>
        {order.fulfilment === "delivery" &&
          order.buyerAddress &&
          !order.deliveredAt && (
            <p className="text-members-muted flex items-start gap-2">
              <IoLocationOutline
                aria-hidden="true"
                className="mt-1 h-5 w-5 shrink-0"
              />
              <span className="min-w-0 break-words">{order.buyerAddress}</span>
            </p>
          )}
      </div>

      <Steps steps={orderSteps(order, figures)} />

      {order.trackingToken && (
        <MembersLinkButton
          href={`/track?token=${encodeURIComponent(order.trackingToken)}`}
          className="self-start"
        >
          <IoNavigateOutline aria-hidden="true" className="h-5 w-5" />
          Suivre la livraison
        </MembersLinkButton>
      )}

      <section
        aria-label="Ce que tu as commandé"
        className="flex flex-col gap-4"
      >
        {figures.groups.map((group) => (
          <div key={group.category} className="flex flex-col gap-1">
            <h3 className="text-members-muted text-sm font-medium tracking-wide uppercase">
              {group.category}
            </h3>
            <ul className="divide-members-line divide-y">
              {group.lines.map((line) => (
                <li
                  key={line.productId}
                  className="flex items-baseline justify-between gap-4 py-2"
                >
                  <span className="min-w-0 break-words">
                    <span className="font-medium tabular-nums">
                      {line.quantity} ×
                    </span>{" "}
                    {line.label}
                    <span className="text-members-muted block text-base">
                      {formatEuros(line.unitPriceCents)} l’unité
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatEuros(line.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <dl className="bg-members-band flex flex-col gap-1.5 rounded-[22px] p-4 sm:p-5">
          <div className="flex justify-between gap-4">
            <dt className="font-medium">Total</dt>
            <dd className="font-members-display text-xl font-semibold tabular-nums">
              {formatEuros(figures.totalCents)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-members-muted">Déjà payé</dt>
            <dd className="tabular-nums">{formatEuros(figures.paidCents)}</dd>
          </div>
          {balance && <p className="mt-1 font-medium">{balance}</p>}
          {order.payments.length > 0 && (
            <ul className="text-members-muted mt-1 flex flex-col gap-0.5 text-base">
              {order.payments.map((payment, i) => (
                <li key={`${payment.paidOn}-${i}`}>{paymentLine(payment)}</li>
              ))}
            </ul>
          )}
        </dl>
      </section>

      {order.document ? (
        <DocumentButton document={order.document} />
      ) : (
        <p className="text-members-muted flex items-start gap-2 text-base">
          <IoDocumentTextOutline
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0"
          />
          Pas de bon de commande joint à cette commande.
        </p>
      )}
    </MembersCard>
  );
}

/** « Mes commandes »: every order a superadmin linked to the member. */
export function MemberOrders() {
  const state = useMemberOrders();
  const { email } = useSiteSettings().contact;
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        current="Mes commandes"
        title="Mes commandes"
        intro="Ce que tu as commandé lors des ventes du Bon Tempérament : le détail, ce qui est payé, la livraison et ton bon de commande."
      />
      {state.status === "loading" && (
        <p role="status" className="text-members-muted py-10 text-center">
          Chargement de tes commandes…
        </p>
      )}
      {state.status === "error" && (
        <MembersCard className="p-5 sm:p-7">
          <p role="alert">
            Tes commandes n’ont pas pu être chargées. Recharge la page dans un
            instant.
          </p>
        </MembersCard>
      )}
      {state.status === "ready" && state.orders.length === 0 && (
        <MembersCard className="flex flex-col items-start gap-4 p-6 sm:p-8">
          <span
            aria-hidden="true"
            className="bg-members-band flex h-14 w-14 items-center justify-center rounded-full"
          >
            <IoBagHandleOutline className="h-7 w-7" />
          </span>
          <h2 className="font-members-display text-[26px] font-semibold">
            Rien de commandé pour l’instant
          </h2>
          <p className="text-members-muted max-w-2xl">
            Quand tu commandes lors d’une vente de l’association (fromages,
            saucissons…), ta commande apparaît ici dès qu’elle est saisie : le
            détail, ce qui reste à payer et ton bon de commande.
          </p>
        </MembersCard>
      )}
      {state.status === "ready" &&
        state.orders.map((order) => <OrderCard key={order.id} order={order} />)}
      {state.status === "ready" && state.orders.length > 0 && (
        <p className="text-members-muted text-base">
          Une erreur dans ta commande ? Écris-nous à{" "}
          <a
            href={`mailto:${email}`}
            className="text-foreground font-medium underline underline-offset-4 hover:no-underline"
          >
            {email}
          </a>
          . Tes commandes restent ici jusqu’à 30 jours après la livraison.
        </p>
      )}
    </div>
  );
}

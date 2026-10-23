"use client";

import { useMemberOrders } from "@/hooks/useMemberOrders";
import {
  articleCountLabel,
  balanceLine,
  handoverLine,
} from "@/lib/membres/orders";
import {
  currentMemberOrder,
  memberOrderFigures,
} from "@repo/domain/utils/memberOrders";
import { formatEuros } from "@repo/domain/utils/orders";
import { IoArrowForwardOutline, IoBagHandleOutline } from "react-icons/io5";
import { MembersLinkButton } from "./MembersButton";
import { MembersCard } from "./MembersCard";

/**
 * « Ta commande » on the members home, only while one of the member's
 * orders is still to come (not delivered or handed over): the sale, when it
 * arrives, the total and what is left to pay, and the way to the details.
 */
export function HomeOrder() {
  const state = useMemberOrders();
  if (state.status !== "ready") return null;
  const order = currentMemberOrder(state.orders);
  if (!order) return null;
  const figures = memberOrderFigures(order);
  const balance = balanceLine(figures);
  return (
    <MembersCard
      as="section"
      aria-labelledby="home-order"
      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-7"
    >
      <span
        aria-hidden="true"
        className="bg-members-band hidden h-16 w-16 shrink-0 items-center justify-center rounded-[20px] sm:flex"
      >
        <IoBagHandleOutline className="h-8 w-8" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2
          id="home-order"
          className="font-members-display text-[24px] leading-tight font-semibold sm:text-[26px]"
        >
          Ta commande · {order.saleTitle}
        </h2>
        <p className="font-medium first-letter:uppercase">
          {handoverLine(order)}
        </p>
        <p className="text-members-muted text-base">
          {articleCountLabel(figures.articleCount)} ·{" "}
          {formatEuros(figures.totalCents)}
          {balance && ` · ${balance}`}
        </p>
      </div>
      <MembersLinkButton
        href="/membres/commandes"
        variant="outline"
        size="md"
        className="self-start sm:self-center"
      >
        Voir ma commande
        <IoArrowForwardOutline aria-hidden="true" className="h-5 w-5" />
      </MembersLinkButton>
    </MembersCard>
  );
}

"use client";

import {
  membersButtonClass,
  MembersLinkButton,
} from "@/components/membres/MembersButton";
import { MembersCard } from "@/components/membres/MembersCard";
import { useEffect } from "react";

/**
 * The members area's error boundary (« Les Pupitres »): the area's header
 * and footer stay, the page's place shows one card in the members look with
 * « Réessayer » (`retry` re-fetches and re-renders the page) and the way back
 * to the area's home. Without it a crash in a page or in a lazy chunk showed
 * Next's unbranded English page.
 */
export default function MembresError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MembersCard
      as="section"
      role="alert"
      aria-labelledby="membres-error-title"
      className="mx-auto mt-6 max-w-xl p-6 text-center sm:mt-10 sm:p-9"
    >
      <h1
        id="membres-error-title"
        className="font-members-display text-foreground text-[28px] leading-tight font-semibold sm:text-[32px]"
      >
        Cette page n’a pas pu s’afficher
      </h1>
      <p className="text-members-muted mt-3">
        Réessaie dans un instant, ou reviens à l’accueil de l’espace membres.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={retry}
          className={membersButtonClass("solid")}
        >
          Réessayer
        </button>
        <MembersLinkButton href="/membres" variant="outline">
          Retour à l’accueil
        </MembersLinkButton>
      </div>
    </MembersCard>
  );
}

"use client";

import type { DonationTier } from "@repo/domain/utils/siteSettings";
import { useState } from "react";
import { FaHeart } from "react-icons/fa";

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/**
 * The suggested amounts and the HelloAsso campaign come from the site
 * settings (admin), read by the page. `defaultAmount` is the tier selected
 * when the page opens; if it names none, the first.
 */
export default function DonationTiers({
  helloassoUrl,
  tiers,
  defaultAmount,
}: {
  helloassoUrl: string;
  tiers: readonly DonationTier[];
  defaultAmount: number;
}) {
  const [selectedAmount, setSelectedAmount] = useState(defaultAmount);
  const selectedTier =
    tiers.find((tier) => tier.amount === selectedAmount) ?? tiers[0];

  // The settings always hold at least one amount; with none, no choice.
  if (!selectedTier) return null;

  return (
    <div>
      <p className="text-foreground mb-3 font-semibold">
        À quoi pourrait servir votre don ?
      </p>
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label="Choisir un exemple de montant"
      >
        {tiers.map((tier) => {
          const isSelected = tier.amount === selectedTier.amount;

          return (
            <button
              key={tier.amount}
              type="button"
              onClick={() => setSelectedAmount(tier.amount)}
              aria-pressed={isSelected}
              className={`min-w-16 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary-text dark:bg-primary/5"
                  : "border-default-300 hover:border-primary/50"
              }`}
            >
              {tier.amount.toLocaleString("fr-FR")} €
            </button>
          );
        })}
      </div>

      <div
        className="bg-surface-secondary mb-6 rounded-lg p-5"
        aria-live="polite"
      >
        <p className="mb-2 text-3xl" aria-hidden="true">
          {selectedTier.emoji}
        </p>
        <p className="text-foreground">{selectedTier.description}</p>
        <p className="text-muted mt-3 text-sm">
          Soit {euroFormatter.format(selectedTier.amount * 0.34)} après
          réduction d&apos;impôt de 66 %.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3">
        <a
          href={helloassoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Continuer sur HelloAsso (nouvel onglet)"
          className="bg-primary-solid hover:bg-primary-solid-hover inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-colors"
        >
          <FaHeart aria-hidden="true" />
          Continuer sur HelloAsso
        </a>
        <p className="text-muted text-sm">
          Un autre montant en tête ? Le montant libre est aussi possible.
        </p>
      </div>
    </div>
  );
}

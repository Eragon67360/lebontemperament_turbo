"use client";

import { useState } from "react";
import { FaHeart } from "react-icons/fa";

const HELLOASSO_CAMPAIGN_URL =
  "https://www.helloasso.com/associations/le-bon-temperament/formulaires/2";

const donationTiers = [
  {
    amount: 5,
    emoji: "🥤",
    description:
      "Achat de « housses anti-bruit » pour les gourdes en métal qui tombent pendant (presque toutes) les répétitions et hérissent la cheffe de chœur !",
  },
  {
    amount: 10,
    emoji: "💡",
    description:
      "Une lampe de pupitre pour nos petits yeux, fragiles, fatigués ou un peu vieux, dans les lieux de concert souvent très beaux… mais sombres.",
  },
  {
    amount: 15,
    emoji: "🗂️",
    description:
      "Une jolie pochette noire rigide pour bien ranger toutes les partitions du chœur et de l’orchestre pendant les concerts.",
  },
  {
    amount: 20,
    emoji: "📖",
    description:
      "Une partition reliée de nos œuvres principales, avec plein de pages qui tombent pendant les concerts et perturbent les musiciens…",
  },
  {
    amount: 30,
    emoji: "🎼",
    description:
      "Un pupitre de concert pour nos talentueux musiciens, qui ont besoin de leurs mains pour tenir leurs instruments plutôt que leurs partitions.",
  },
  {
    amount: 200,
    emoji: "🏛️",
    description:
      "La location d’un lieu de concert pour accueillir notre très grand ensemble de presque 100 choristes et musiciens… et son public nombreux.",
  },
  {
    amount: 2000,
    emoji: "🥁",
    description:
      "Des timbales pour notre incroyable percussionniste : nous aimerions acheter, plutôt que louer, cet instrument essentiel.",
  },
] as const;

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export default function DonationTiers() {
  const [selectedTier, setSelectedTier] = useState<
    (typeof donationTiers)[number]
  >(donationTiers[3]);

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
        {donationTiers.map((tier) => {
          const isSelected = tier.amount === selectedTier.amount;

          return (
            <button
              key={tier.amount}
              type="button"
              onClick={() => setSelectedTier(tier)}
              aria-pressed={isSelected}
              className={`min-w-16 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
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
          href={HELLOASSO_CAMPAIGN_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Continuer sur HelloAsso (nouvel onglet)"
          className="bg-primary hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-colors"
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

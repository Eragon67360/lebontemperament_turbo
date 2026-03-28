"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";

const AMOUNT_PRESETS = [
  { label: "10 €", value: 1000 },
  { label: "25 €", value: 2500 },
  { label: "50 €", value: 5000 },
  { label: "100 €", value: 10000 },
];

export function DonationForm() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(2500);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const getAmountCents = (): number | null => {
    if (customAmount) {
      const parsed = parseInt(customAmount, 10);
      if (isNaN(parsed) || parsed < 1) return null;
      return parsed * 100;
    }
    return selectedAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const amountCents = getAmountCents();
    if (!amountCents || amountCents < 100) {
      setError("Veuillez choisir un montant d'au moins 1 €");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/donations/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Impossible de rediriger vers le paiement");
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors de la connexion au paiement");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (value: number) => {
    setCustomAmount("");
    setSelectedAmount(value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <p className="text-default-600 mb-3 text-sm">
          Choisissez un montant ou saisissez un montant personnalisé :
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {AMOUNT_PRESETS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => handlePresetClick(value)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                selectedAmount === value && !customAmount
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-default-300 hover:border-primary/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="custom-amount" className="text-default-600 text-sm">
            Autre montant (€) :
          </label>
          <input
            id="custom-amount"
            type="number"
            min="1"
            step="1"
            placeholder="ex. 75"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            className="border-default-300 w-24 rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="text-default-500 text-xs">
        Vous serez redirigé vers Stripe pour effectuer le paiement de manière
        sécurisée. Une adresse de facturation sera demandée (obligatoire pour le
        reçu fiscal).
      </p>
      {error && (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading || !getAmountCents()}
        className="bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <FiLoader className="h-4 w-4 animate-spin" />
            Redirection en cours...
          </>
        ) : (
          "Faire un don"
        )}
      </button>
    </form>
  );
}

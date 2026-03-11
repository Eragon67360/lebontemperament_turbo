/**
 * Converts a number to French words (e.g. for "chiffres en lettres" in tax receipts).
 * Supports amounts up to 999 999 euros.
 */

const UNITS = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
];

const TEENS = [
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

const TENS = [
  "",
  "",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante",
  "quatre-vingt",
  "quatre-vingt",
];

function numberToFrenchUnder100(n: number): string {
  if (n === 0) return "";
  if (n < 10) return UNITS[n]!;
  if (n < 20) return TEENS[n - 10]!;
  if (n < 70) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    if (unit === 0) return TENS[ten]!;
    if (unit === 1 && ten !== 8) return `${TENS[ten]}-et-un`;
    return `${TENS[ten]!}-${UNITS[unit]}`;
  }
  if (n < 80) {
    const unit = n - 60;
    if (unit === 10) return "soixante-dix";
    return `soixante-${TEENS[unit - 10]}`;
  }
  if (n < 100) {
    const unit = n - 80;
    if (unit === 0) return "quatre-vingts";
    if (unit < 10) return `quatre-vingt-${UNITS[unit]}`;
    return `quatre-vingt-${TEENS[unit - 10]}`;
  }
  return "";
}

function numberToFrenchUnder1000(n: number): string {
  if (n === 0) return "";
  if (n < 100) return numberToFrenchUnder100(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const cent =
    hundreds === 1
      ? "cent"
      : rest === 0
        ? `${UNITS[hundreds]} cents`
        : `${UNITS[hundreds]} cent`;
  if (rest === 0) return hundreds === 1 ? "cent" : `${UNITS[hundreds]} cents`;
  return `${cent} ${numberToFrenchUnder100(rest)}`;
}

/**
 * Converts cents (integer) to French words for euros.
 * Example: 5000 -> "cinquante euros"
 * Example: 1 -> "zéro euro et un centime"
 */
export function numberToFrenchWords(cents: number): string {
  if (cents < 0) throw new Error("Negative amounts not supported");

  const euros = Math.floor(cents / 100);
  const centimes = cents % 100;

  if (euros >= 1000000) {
    throw new Error("Amount too large for conversion");
  }

  let result = "";

  if (euros === 0 && centimes === 0) {
    return "zéro euro";
  }

  if (euros >= 1000) {
    const thousands = Math.floor(euros / 1000);
    const rest = euros % 1000;
    if (thousands === 1) {
      result = rest === 0 ? "mille" : `mille ${numberToFrenchUnder1000(rest)}`;
    } else {
      result =
        rest === 0
          ? `${numberToFrenchUnder1000(thousands)} mille`
          : `${numberToFrenchUnder1000(thousands)} mille ${numberToFrenchUnder1000(rest)}`;
    }
  } else if (euros > 0) {
    result = numberToFrenchUnder1000(euros);
  } else {
    result = "zéro";
  }

  result += euros === 1 ? " euro" : " euros";

  if (centimes > 0) {
    result += " et ";
    result +=
      centimes === 1
        ? "un centime"
        : `${numberToFrenchUnder100(centimes)} centimes`;
  }

  return result;
}

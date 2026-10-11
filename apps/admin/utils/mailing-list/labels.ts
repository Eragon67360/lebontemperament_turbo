// utils/mailing-list/labels.ts — wording of the roster ↔ list comparison card.

const plural = (n: number, one: string, many: string) =>
  `${n} ${n > 1 ? many : one}`;

/** Addresses as Google Groups' « Ajouter des membres » box accepts them. */
export function addressesForClipboard(emails: readonly string[]): string {
  return emails.join(", ");
}

/** The card's headline for a successful comparison. */
export function comparisonHeadline(missing: number, extra: number): string {
  if (missing === 0 && extra === 0) return "La liste est à jour";
  const parts = [
    missing > 0 && plural(missing, "personne à ajouter", "personnes à ajouter"),
    extra > 0 && plural(extra, "adresse à retirer", "adresses à retirer"),
  ].filter(Boolean);
  return parts.join(", ").replace(/^./, (c) => c.toUpperCase());
}

/** « 12 membres du tableau sans adresse e-mail valide ne sont pas comparés. » */
export function withoutEmailNote(count: number): string | null {
  if (count === 0) return null;
  return count === 1
    ? "1 ligne du tableau sans adresse e-mail valide n'est pas comparée."
    : `${count} lignes du tableau sans adresse e-mail valide ne sont pas comparées.`;
}

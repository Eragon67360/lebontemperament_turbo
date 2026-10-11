import assert from "node:assert/strict";
import {
  addressesForClipboard,
  comparisonHeadline,
  withoutEmailNote,
} from "./labels";

// Fictional addresses only.
assert.equal(
  addressesForClipboard(["a@example.com", "b@example.com"]),
  "a@example.com, b@example.com",
);
assert.equal(addressesForClipboard([]), "");

assert.equal(comparisonHeadline(0, 0), "La liste est à jour");
assert.equal(comparisonHeadline(1, 0), "1 personne à ajouter");
assert.equal(comparisonHeadline(0, 3), "3 adresses à retirer");
assert.equal(
  comparisonHeadline(2, 1),
  "2 personnes à ajouter, 1 adresse à retirer",
);

assert.equal(withoutEmailNote(0), null);
assert.equal(
  withoutEmailNote(1),
  "1 ligne du tableau sans adresse e-mail valide n'est pas comparée.",
);
assert.equal(
  withoutEmailNote(4),
  "4 lignes du tableau sans adresse e-mail valide ne sont pas comparées.",
);

console.log("mailing list labels tests passed");

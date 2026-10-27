import assert from "node:assert/strict";
import { asciiWords, foldAccents, slugify } from "./slug";

// --- foldAccents: accents and ligatures gone, case and spacing kept ---
assert.equal(
  foldAccents("Élève du chœur, ex æquo"),
  "Eleve du choeur, ex aequo",
);
assert.equal(foldAccents("Œuvres de Fauré"), "Oeuvres de Faure");
assert.equal(foldAccents("ŒUVRE Æ"), "OEUVRE AE");
assert.equal(foldAccents("Æneid"), "Aeneid");
assert.equal(foldAccents("  Émile Zoé "), "  Emile Zoe ");
assert.equal(
  foldAccents("AÉÈÊËÀÂÎÏÔÛÙÜÇ aéèêëàâîïôûùüç ÿ Ÿ"),
  "AEEEEAAIIOUUUC aeeeeaaiiouuuc y Y",
);
assert.equal(foldAccents("plain ASCII 123 !?"), "plain ASCII 123 !?");
assert.equal(foldAccents(""), "");

// --- asciiWords: the words of a file name, case kept ---
assert.equal(
  asciiWords("Compte-Rendu Assemblée Générale 2025"),
  "Compte-Rendu-Assemblee-Generale-2025",
);
assert.equal(asciiWords("Gazette n°12 (été)"), "Gazette-n-12-ete");
assert.equal(asciiWords("Œuvres de Fauré"), "Oeuvres-de-Faure");
assert.equal(asciiWords("--weird__name--"), "weird-name");
assert.equal(asciiWords("  ¿¿¿ "), "");

// --- slugify: byte-identical to the slugs made before this helper existed ---
// Measured on the admin's project slug, the sale export's slug, the document
// collection slug and the Drive folder slug before they were merged here:
// all four gave these, so published addresses keep them.
const unchanged: ReadonlyArray<[string, string]> = [
  ["Concert de Noël 2024 !", "concert-de-noel-2024"],
  ["Élise", "elise"],
  ["Fête de l'été", "fete-de-l-ete"],
  ["Thérèse  MARTIN", "therese-martin"],
  ["  Émile Zoé ", "emile-zoe"],
  ["Pêle-Mêle !", "pele-mele"],
  ["Textes de l'association", "textes-de-l-association"],
  [
    "Fromages et saucissons · novembre 2026",
    "fromages-et-saucissons-novembre-2026",
  ],
  ["Ave Maria – Caccini", "ave-maria-caccini"],
  ["Cahier 40 ans", "cahier-40-ans"],
  ["Éveil & Jeux !", "eveil-jeux"],
  ["Répétition n°2 (alto)", "repetition-n-2-alto"],
  ["Ça va ? Très bien !", "ca-va-tres-bien"],
  ["Où êtes-vous allés, à Noël ?", "ou-etes-vous-alles-a-noel"],
  ["AÉÈÊËÀÂÎÏÔÛÙÜÇ aéèêëàâîïôûùüç ÿ Ÿ", "aeeeeaaiiouuuc-aeeeeaaiiouuuc-y-y"],
  ["A-B_C.D", "a-b-c-d"],
  ["--- ---", ""],
  ["!!!", ""],
  ["", ""],
];
for (const [input, slug] of unchanged) {
  assert.equal(slugify(input), slug, JSON.stringify(input));
}

// --- slugify: ligatures are folded, no longer dropped ---
assert.equal(slugify("Chœur et orchestre"), "choeur-et-orchestre");
assert.equal(slugify("Chœur d'été"), "choeur-d-ete");
assert.equal(slugify("Œuvres de Fauré"), "oeuvres-de-faure");
assert.equal(slugify("Ex æquo"), "ex-aequo");
assert.equal(slugify("ŒUVRE"), "oeuvre");
assert.equal(slugify("Æneid"), "aeneid");
assert.equal(slugify("cœur"), "coeur");

// --- maxLength: cut there, never ending with a dash ---
assert.equal(slugify("a".repeat(100), 60).length, 60);
assert.equal(slugify(`${"a".repeat(59)} b`, 60), "a".repeat(59));
assert.equal(slugify("ab cd", 3), "ab");
assert.equal(slugify("abc", 0), "");

console.log("slug: all assertions passed");

// The Excel export: its five sheets, the figures they carry, and a real
// .xlsx written with write-excel-file. Fake data only (testData.ts).
import assert from "node:assert/strict";
import type { CellObject, Row } from "write-excel-file/node";
import writeExcelFile from "write-excel-file/node";
import { detail } from "./testData";
import { saleWorkbook, xlsxFilename } from "./workbook";

const NOW = new Date("2026-10-14T08:30:00Z");
const sheets = saleWorkbook(detail, NOW);

const value = (cell: Row[number]) =>
  cell && typeof cell === "object" && !(cell instanceof Date)
    ? (cell as CellObject).value
    : cell;
const values = (row: Row) => row.map(value);
const find = (rows: Row[], first: unknown) =>
  rows.find((r) => value(r[0]) === first);

assert.equal(
  xlsxFilename("Fromages et saucissons · novembre 2026"),
  "commandes-fromages-et-saucissons-novembre-2026.xlsx",
);
assert.deepEqual(
  sheets.map((s) => s.sheet),
  ["Résumé", "Acheteurs", "Détail par acheteur", "Fournisseurs", "Paiements"],
);
for (const s of sheets) {
  assert.ok(s.sheet!.length <= 31, `${s.sheet}: Excel caps names at 31`);
}

// --- Résumé: totals in euros (numbers, so Excel can add them) ---
const resume = sheets[0]!.data;
assert.equal(value(resume[0]![0]), "Fromages et saucissons · novembre 2026");
assert.equal(
  value(resume[1]![0]),
  "Commandes jusqu'au vendredi 13 novembre · livraison le vendredi 27 novembre",
);
assert.match(
  String(value(resume[2]![0])),
  /^Exporté le 14 octobre 2026 à \d\d:30$/,
);
assert.equal(value(find(resume, "Commandes")![1]), 4);
assert.equal(value(find(resume, "Retraits")![1]), 1);
// Léa 22 + 12 = 34, Marc 4, Émile 11, Zoé 9 → 58 €; paid 20 + 4 + 10 = 34 €.
assert.equal(value(find(resume, "Montant total")![1]), 58);
assert.equal(value(find(resume, "Déjà payé")![1]), 34);
// Owed: Léa 14 + Émile 11 = 25 €; Zoé paid 1 € too much.
assert.equal(value(find(resume, "Reste à payer")![1]), 25);
assert.equal(value(find(resume, "Trop perçu (à rendre)")![1]), 1);
assert.equal(value(find(resume, "Virement")![1]), 20);
assert.equal(value(find(resume, "Espèces")![1]), 14);
assert.deepEqual(values(find(resume, "Salaison TEST")!), [
  "Salaison TEST",
  4,
  16,
]);

// --- Acheteurs: categories over the products, one row per buyer ---
const buyers = sheets[1]!;
assert.equal(buyers.stickyRowsCount, 3);
assert.equal(buyers.stickyColumnsCount, 1);
const [, groups, heads] = buyers.data;
assert.deepEqual(
  groups!.map(value).filter((v) => v !== undefined && v !== null),
  ["Acheteur", "Fromages", "Saucissons", "Fromages", "Paiement"],
);
assert.deepEqual(values(heads!).slice(5, 8), [
  "Comté · 500 g",
  "Saucisson · Noix",
  "Raclette",
]);
assert.equal(heads!.length, buyers.columns!.length);
const lea = find(buyers.data, "Léa TEST")!;
assert.deepEqual(values(lea), [
  "Léa TEST",
  "06 12 34 56 78",
  "1 rue de l'Exemple, 67000 Strasbourg",
  "Camille ROTH",
  "Livraison",
  2,
  3,
  undefined,
  34,
  20,
  14,
  "Paiement partiel",
]);
const totalRow = buyers.data.at(-1)!;
assert.deepEqual(values(totalRow).slice(5), [3, 4, 1, 58, 34, 24, undefined]);

// --- Détail par acheteur: each buyer's lines and what is left ---
const lines = sheets[2]!.data;
const leaAt = lines.findIndex((r) => value(r[0]) === "Léa TEST");
assert.ok(leaAt > 0);
assert.match(
  String(value(lines[leaAt + 1]![0])),
  /^Livraison · 06 12 34 56 78 · 1 rue/,
);
assert.deepEqual(values(find(lines.slice(leaAt), "Comté · 500 g")!), [
  "Comté · 500 g",
  2,
  11,
  22,
]);
const zoeAt = lines.findIndex((r) => value(r[0]) === "Zoé TEST");
const zoeEnd = lines.slice(zoeAt).find((r) => value(r[0]) === "Trop perçu")!;
assert.equal(value(zoeEnd[3]), 1);

// --- Fournisseurs: what to order ---
const suppliers = sheets[3]!.data;
assert.deepEqual(values(find(suppliers, "Total Fruitière TEST")!), [
  "Total Fruitière TEST",
  4,
  undefined,
  42,
]);

// --- Paiements: dated, as real dates ---
const payments = sheets[4]!.data;
const first = payments[4]!;
assert.ok(value(first[0]) instanceof Date);
assert.equal(
  (value(first[0]) as Date).toISOString(),
  "2026-10-03T00:00:00.000Z",
);
assert.deepEqual(values(payments.at(-1)!).slice(0, 4), [
  "Total",
  "3 paiements",
  undefined,
  34,
]);

// --- A real file: a zip (« PK ») that the library accepts as is ---
const buffer = await writeExcelFile(sheets, {
  fontFamily: "Calibri",
  fontSize: 11,
}).toBuffer();
assert.equal(buffer.subarray(0, 2).toString(), "PK");
assert.ok(buffer.length > 4000);

console.log("orders/workbook: all assertions passed");

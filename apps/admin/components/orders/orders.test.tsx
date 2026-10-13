// Static renders of « Commandes » (no DOM, no queries): what a superadmin
// reads on a sale row, in the figures, in a buyer's row and in the catalogue,
// and the names of the actions. Fake data only.
import type {
  SaleDetail,
  SaleListItem,
  SaleOrder,
  SaleProduct,
} from "@/utils/orders/types";
import { saleView } from "@/utils/orders/view";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BuyersList } from "./BuyersList";
import { CatalogueSection } from "./CatalogueSection";
import { SaleFigures } from "./SaleFigures";
import { SaleRow } from "./SaleRow";
import { SuppliersSection } from "./SuppliersSection";

const noop = () => {};
const NBSP = "\u00a0";
// fr-FR groups thousands with a narrow no-break space.
const THIN = "[\\u00a0\\u202f]";
const NOW = new Date(2026, 9, 13);
const SALE_ID = "11111111-1111-4111-8111-111111111111";
const P = (n: number) =>
  `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
const O = (n: number) =>
  `bbbbbbbb-bbbb-4bbb-8bbb-${String(n).padStart(12, "0")}`;

const product = (
  n: number,
  fields: Partial<SaleProduct> & Pick<SaleProduct, "name" | "unit_price_cents">,
): SaleProduct => ({
  id: P(n),
  sale_id: SALE_ID,
  category: "Fromages et charcuterie",
  variant: null,
  supplier: "Fruitière TEST",
  display_order: n * 10,
  is_available: true,
  created_at: "",
  updated_at: "",
  ...fields,
});

const order = (
  n: number,
  fields: Partial<SaleOrder> & Pick<SaleOrder, "buyer_name" | "items">,
): SaleOrder => ({
  id: O(n),
  sale_id: SALE_ID,
  buyer_phone: null,
  buyer_address: null,
  sold_by: null,
  fulfilment: "delivery",
  notes: null,
  delivery_recipient_id: null,
  handed_over_at: null,
  personal_data_erased_at: null,
  created_by: null,
  created_at: "",
  updated_at: "",
  payments: [],
  ...fields,
});

const sale: SaleListItem = {
  id: SALE_ID,
  title: "Fromages et saucissons · novembre 2026",
  order_deadline: "2026-11-13",
  delivery_date: "2026-11-27",
  archived_at: null,
  created_by: null,
  created_at: "",
  updated_at: "",
  orderCount: 12,
  totalCents: 123450,
  dueCents: 12000,
};

const detail: SaleDetail = {
  sale,
  products: [
    product(1, {
      name: "Comté fruité",
      variant: "500 g",
      unit_price_cents: 1100,
    }),
    product(2, {
      name: "Saucisson",
      variant: "Noix",
      category: "Saucissons",
      supplier: "Salaison TEST",
      unit_price_cents: 400,
    }),
    product(3, {
      name: "Raclette",
      unit_price_cents: 900,
      is_available: false,
    }),
  ],
  orders: [
    order(1, {
      buyer_name: "Léa TEST",
      buyer_phone: "06 12 34 56 78",
      sold_by: "dddddddd-dddd-4ddd-8ddd-000000000001",
      items: [
        { product_id: P(1), quantity: 2 },
        { product_id: P(2), quantity: 3 },
      ],
      payments: [
        {
          id: "cccccccc-cccc-4ccc-8ccc-000000000001",
          order_id: O(1),
          amount_cents: 2000,
          method: "transfer",
          paid_on: "2026-10-03",
          note: null,
          recorded_by: null,
          created_at: "",
        },
      ],
    }),
    order(2, {
      buyer_name: "Marc TEST",
      fulfilment: "pickup",
      items: [{ product_id: P(2), quantity: 1 }],
      payments: [
        {
          id: "cccccccc-cccc-4ccc-8ccc-000000000002",
          order_id: O(2),
          amount_cents: 400,
          method: "cash",
          paid_on: "2026-10-03",
          note: null,
          recorded_by: null,
          created_at: "",
        },
      ],
      handed_over_at: "2026-11-27T10:00:00Z",
      delivery_recipient_id: "eeeeeeee-eeee-4eee-8eee-000000000001",
    }),
  ],
  sellers: { "dddddddd-dddd-4ddd-8ddd-000000000001": "Camille ROTH" },
};

const html = (element: Parameters<typeof renderToStaticMarkup>[0]) =>
  renderToStaticMarkup(element);
const noRawColours = (markup: string) =>
  assert.doesNotMatch(markup, /bg-white|text-gray|border-gray|#[0-9a-f]{6}/i);

// --- A sale row: title, dates, count, total and what is owed; one link ---
{
  const markup = html(createElement(SaleRow, { sale, now: NOW }));
  assert.match(markup, /Fromages et saucissons · novembre 2026/);
  assert.match(
    markup,
    /Commandes jusqu(&#x27;|')au vendredi 13 novembre · livraison le vendredi 27 novembre/,
  );
  assert.match(markup, /12 commandes/);
  assert.match(markup, new RegExp(`1${THIN}234,50${NBSP}€`));
  assert.match(markup, new RegExp(`reste à encaisser 120,00${NBSP}€`));
  assert.match(
    markup,
    new RegExp(`href="/dashboard/admin/commandes/${SALE_ID}"`),
  );
  assert.doesNotMatch(markup, /Archivée/);
  noRawColours(markup);

  const archived = html(
    createElement(SaleRow, {
      sale: { ...sale, archived_at: "2026-12-01T00:00:00Z", dueCents: 0 },
      now: NOW,
    }),
  );
  assert.match(archived, /Archivée/);
  assert.match(archived, /tout est encaissé/);
}

// --- The figures ---
const { summary, rows } = saleView(detail);
{
  const markup = html(createElement(SaleFigures, { summary }));
  assert.match(markup, />Total commandé<\/dt>/);
  assert.match(markup, new RegExp(`>38,00${NBSP}€<`)); // 2×11 + 3×4 + 1×4
  assert.match(markup, />Encaissé<\/dt>/);
  assert.match(markup, new RegExp(`>24,00${NBSP}€<`));
  assert.match(
    markup,
    new RegExp(`Virement 20,00${NBSP}€ · Espèces 4,00${NBSP}€`),
  );
  assert.doesNotMatch(markup, /Chèque/);
  assert.match(markup, />Reste à encaisser<\/dt>/);
  assert.match(markup, new RegExp(`>14,00${NBSP}€<`));
  assert.match(markup, /2 commandes dont 1 à régler/);
  noRawColours(markup);
}

// --- The buyers: table and stacked rows, state chips, the row's actions ---
{
  const markup = html(
    createElement(BuyersList, {
      rows,
      onEdit: noop,
      onPay: noop,
      onHandOver: noop,
      onDelete: noop,
    }),
  );
  // Both layouts render; CSS picks one.
  assert.match(markup, /<table/);
  assert.match(markup, /<ul class="[^"]*md:hidden/);
  assert.match(markup, />Acheteur<\/th>/);
  assert.match(markup, />Vendu par<\/th>/);
  assert.match(markup, /Léa TEST/);
  assert.match(markup, /06 12 34 56 78/);
  assert.match(markup, /Camille ROTH/);
  assert.match(markup, />Livraison<\/td>/);
  assert.match(markup, />Retrait<\/td>/);
  // Léa: 34 € ordered, 20 € paid, 14 € left, partial.
  assert.match(markup, new RegExp(`>34,00${NBSP}€<`));
  assert.match(markup, new RegExp(`>14,00${NBSP}€<`));
  assert.match(markup, /Paiement partiel/);
  assert.match(markup, /Payé/);
  assert.match(markup, /bg-warning-soft/);
  assert.match(markup, /bg-success-soft/);
  // Marc is in a round and handed over.
  assert.match(markup, /Dans la tournée/);
  assert.match(markup, />Remis</);
  // Actions: a visible « Modifier », the menu named after the buyer.
  assert.match(
    markup,
    /Modifier<span class="sr-only"> la commande de « Léa TEST »/,
  );
  assert.match(
    markup,
    /Plus d(&#x27;|')actions pour la commande de « Léa TEST »/,
  );
  assert.match(markup, /aria-haspopup="menu"/);
  // Menu items only exist once open: nothing destructive on the page.
  assert.doesNotMatch(markup, />Supprimer…</);
  assert.doesNotMatch(markup, /Enregistrer un paiement/);
  noRawColours(markup);
}

// --- Suppliers: what to order from each, products under their supplier ---
{
  const markup = html(createElement(SuppliersSection, { summary }));
  assert.match(markup, /<h3[^>]*>Fruitière TEST<\/h3>/);
  assert.match(markup, /<h3[^>]*>Salaison TEST<\/h3>/);
  assert.match(markup, /Comté fruité · 500 g/);
  assert.match(markup, /Saucisson · Noix/);
  // 4 saucissons for 16 €; 2 comtés for 22 €.
  assert.match(markup, new RegExp(`4 articles · 16,00${NBSP}€`));
  assert.match(markup, new RegExp(`2 articles · 22,00${NBSP}€`));
  assert.doesNotMatch(markup, /Raclette/); // nobody ordered it
  noRawColours(markup);

  const empty = html(
    createElement(SuppliersSection, {
      summary: { ...summary, suppliers: [] },
    }),
  );
  assert.match(empty, /Rien à commander pour le moment/);
}

// --- Catalogue: by category, switch, « Modifier », arrows, menu ---
{
  const markup = html(
    createElement(CatalogueSection, {
      products: detail.products,
      orderedQuantities: new Map(
        summary.products.map((p) => [p.productId, p.quantity]),
      ),
      onAdd: noop,
      onEdit: noop,
      onToggleAvailable: noop,
      onMove: noop,
      onDelete: noop,
    }),
  );
  assert.match(markup, /<h3[^>]*>Fromages et charcuterie<\/h3>/);
  assert.match(markup, /<h3[^>]*>Saucissons<\/h3>/);
  assert.match(
    markup,
    new RegExp(`11,00${NBSP}€ · Fruitière TEST · 2 commandés`),
  );
  assert.match(markup, /plus proposé/); // Raclette is hidden from new orders
  assert.match(markup, /role="switch"[^>]*aria-checked="true"/);
  assert.match(markup, /role="switch"[^>]*aria-checked="false"/);
  assert.match(markup, /Disponible : Raclette/);
  assert.match(
    markup,
    /Modifier<span class="sr-only"> « Comté fruité · 500 g »/,
  );
  assert.match(markup, /Monter « Saucisson · Noix »/);
  assert.match(markup, /Descendre « Comté fruité · 500 g »/);
  // The first can't go up, the last (categories in order of appearance:
  // Comté, Raclette, then Saucisson) can't go down.
  const up = markup
    .split("<button")
    .find((b) => b.includes("Monter « Comté fruité"));
  assert.match(up ?? "", /\sdisabled=""/);
  const down = markup
    .split("<button")
    .find((b) => b.includes("Descendre « Saucisson · Noix"));
  assert.match(down ?? "", /\sdisabled=""/);
  assert.match(markup, /Plus d(&#x27;|')actions pour « Raclette »/);
  assert.match(markup, /un produit dans « Saucissons »/);
  noRawColours(markup);

  const empty = html(
    createElement(CatalogueSection, {
      products: [],
      orderedQuantities: new Map(),
      onAdd: noop,
      onEdit: noop,
      onToggleAvailable: noop,
      onMove: noop,
      onDelete: noop,
    }),
  );
  assert.match(empty, /Le catalogue est vide/);
  assert.match(empty, /Ajouter un produit/);
}

console.log("orders: all assertions passed");

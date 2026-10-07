// The row menu's names and its closed state (static render, no DOM): the
// trigger names the item; « Supprimer… » is named after it too. A closed
// Radix menu renders no items, so the item's name is checked through the
// pure helper the component uses.
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RowActionsMenu, rowActionsLabels } from "./row-actions-menu";

// --- Names: the item in guillemets, or the row's own phrase ---
assert.deepEqual(rowActionsLabels("Requiem"), {
  trigger: "Plus d'actions pour « Requiem »",
  delete: "Supprimer « Requiem »",
});
assert.deepEqual(rowActionsLabels("Lucie", "le témoignage de Lucie"), {
  trigger: "Plus d'actions pour le témoignage de Lucie",
  delete: "Supprimer le témoignage de Lucie",
});

// --- The trigger: a 44 px ghost icon button opening a menu ---
{
  const html = renderToStaticMarkup(
    createElement(RowActionsMenu, { name: "Requiem", onDelete: () => {} }),
  );
  assert.match(html, /<button[^>]*type="button"/);
  assert.match(html, /aria-haspopup="menu"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /size-\(--control-h\)/);
  assert.match(html, /title="Plus d(&#x27;|')actions"/);
  assert.match(
    html,
    /<span class="sr-only">Plus d(&#x27;|')actions pour « Requiem »<\/span>/,
  );
  // Closed: no item, and nothing red on the row.
  assert.doesNotMatch(html, /Supprimer/);
  assert.doesNotMatch(html, /danger/);
  assert.doesNotMatch(html, /disabled=""/);
}

// --- A busy row: the menu waits ---
{
  const html = renderToStaticMarkup(
    createElement(RowActionsMenu, {
      name: "Requiem",
      onDelete: () => {},
      disabled: true,
    }),
  );
  assert.match(html, /disabled=""/);
}

console.log("row actions menu: all assertions passed");

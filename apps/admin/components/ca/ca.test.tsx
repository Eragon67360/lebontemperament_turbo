// Static renders of a « Comptes rendus du CA » row (no DOM, no queries):
// the meeting, the PDF link and the name of the « ⋯ » menu.
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CARow } from "./CARow";

const noop = () => {};

// --- With a PDF: title, day, the link in a new tab, the menu's name ---
{
  const html = renderToStaticMarkup(
    createElement(CARow, {
      ca: {
        id: "c1",
        title: "Conseil de rentrée",
        date_from: "2025-09-12",
        file_url: "https://example.org/ca.pdf",
      },
      onDelete: noop,
    }),
  );
  assert.match(html, /Conseil de rentrée/);
  assert.match(html, /Réunion du 12 septembre 2025/);
  assert.match(html, /href="https:\/\/example\.org\/ca\.pdf"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /Ouvrir le PDF/);
  assert.match(html, /Plus d&#x27;actions pour « Conseil de rentrée »/);
  assert.doesNotMatch(html, /Aucun fichier joint/);
}

// --- Without a file, the row says so instead of a dead link ---
{
  const html = renderToStaticMarkup(
    createElement(CARow, {
      ca: {
        id: "c2",
        title: "Assemblée de printemps",
        date_from: "2026-04-03",
        file_url: null,
      },
      onDelete: noop,
    }),
  );
  assert.match(html, /Aucun fichier joint/);
  assert.doesNotMatch(html, /Ouvrir le PDF/);
}

console.log("components/ca: ok");

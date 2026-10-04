// Static renders of the concerts screen's presentational pieces (no DOM,
// no queries): what the admin reads in the live preview and in a row.
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConcertPreview, isReservationLink } from "./ConcertPreview";

const empty = {
  name: "",
  place: "",
  date: null,
  time: "",
  additional_informations: "",
  related_link: "",
  posterUrl: null,
};

// --- An empty form keeps the preview honest ---
{
  const html = renderToStaticMarkup(
    createElement(ConcertPreview, { values: empty }),
  );
  assert.match(html, /Pas d(&#x27;|')affiche pour le moment/);
  assert.match(html, /Date à choisir/);
  assert.match(html, /Lieu manquant/);
  assert.match(html, /Concert sans titre/);
  assert.doesNotMatch(html, /Informations et réservation/);
  assert.doesNotMatch(html, /<img/);
}

// --- A filled form reads like the public card ---
{
  const html = renderToStaticMarkup(
    createElement(ConcertPreview, {
      values: {
        name: "Entre terre et ciel",
        place: "Église Saint-Paul, Strasbourg",
        date: new Date(2026, 8, 15),
        time: "20:30",
        additional_informations:
          "Entrée libre, plateau au profit de l'association.",
        related_link: "https://billetterie.example.org/concert",
        posterUrl: "blob:local-preview",
      },
    }),
  );
  assert.match(html, /Mardi 15 septembre 2026 · 20 h 30/);
  assert.match(html, /Entre terre et ciel/);
  assert.match(html, /Église Saint-Paul, Strasbourg/);
  assert.match(html, /Entrée libre, plateau/);
  assert.match(html, /Informations et réservation/);
  assert.match(html, /<img[^>]*src="blob:local-preview"/);
  assert.doesNotMatch(html, /Lieu manquant|Date à choisir/);
}

// --- Without a name the site writes « Concert à … » ---
{
  const html = renderToStaticMarkup(
    createElement(ConcertPreview, {
      values: { ...empty, place: "Strasbourg" },
    }),
  );
  assert.match(html, /Concert à Strasbourg/);
}

// --- The reservation button needs a real address ---
assert.equal(isReservationLink("https://example.org/x"), true);
assert.equal(isReservationLink("billetterie.example.org"), false);
assert.equal(isReservationLink(""), false);
assert.equal(isReservationLink("javascript:alert(1)"), false);

console.log("concerts components: all assertions passed");

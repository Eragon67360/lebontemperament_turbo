// Static renders of the concerts screen's presentational pieces (no DOM,
// no queries): what the admin reads in the live preview and in a row, and
// the names of a row's actions.
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConcertPreview, isReservationLink } from "./ConcertPreview";
import { ConcertRow } from "./ConcertRow";
import { TourRow } from "./TourRow";

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

const noop = () => {};

// --- A concert row: « Modifier » visible, « Supprimer… » in the menu ---
{
  const html = renderToStaticMarkup(
    createElement(ConcertRow, {
      concert: {
        additional_informations: null,
        affiche: null,
        context: "choeur",
        created_at: null,
        created_by: null,
        city: null,
        country: null,
        date: "2026-11-21",
        event_data_generated_at: null,
        id: "c1",
        is_free: null,
        name: "Requiem",
        place: "Église Saint-Test",
        postal_code: null,
        price: null,
        related_link: null,
        street_address: null,
        time: "20:30:00",
        tour_id: null,
        updated_at: null,
        venue_name: null,
      },
      onEdit: noop,
      onDelete: noop,
    }),
  );
  assert.match(html, /Modifier<span class="sr-only"> « Requiem »/);
  assert.match(html, /Plus d(&#x27;|')actions pour « Requiem »/);
  assert.match(html, /aria-haspopup="menu"/);
  assert.doesNotMatch(html, />Supprimer</);
  assert.doesNotMatch(html, /border-danger/);
}

// --- A tour row: the same quiet end ---
{
  const html = renderToStaticMarkup(
    createElement(TourRow, {
      tour: {
        context: "orchestre",
        created_at: null,
        created_by: null,
        description: null,
        end_date: null,
        id: "t1",
        is_active: true,
        name: "Tournée d'automne",
        start_date: null,
        tour_poster: null,
        updated_at: null,
      },
      onEdit: noop,
      onDelete: noop,
      onManageConcerts: noop,
    }),
  );
  assert.match(html, /Gérer les concerts/);
  assert.match(
    html,
    /Modifier<span class="sr-only"> « Tournée d(&#x27;|')automne »/,
  );
  assert.match(
    html,
    /Plus d(&#x27;|')actions pour « Tournée d(&#x27;|')automne »/,
  );
  assert.doesNotMatch(html, />Supprimer</);
  assert.doesNotMatch(html, /border-danger/);
}

console.log("concerts components: all assertions passed");

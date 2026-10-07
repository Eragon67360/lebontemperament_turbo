// Static renders of the member-season rows (no DOM, no queries): what the
// admin reads in a rehearsal or an event row, and the names of its actions.
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EventRow } from "./EventRow";
import { RehearsalRow } from "./RehearsalRow";

const noop = () => {};

// --- A rehearsal row: date, group, hours, place, « Modifier » and the menu ---
{
  const html = renderToStaticMarkup(
    createElement(RehearsalRow, {
      rehearsal: {
        id: "r1",
        name: "Répétition générale",
        place: "Salle paroissiale, Barr",
        date: "2026-10-06",
        start_time: "20:00:00",
        end_time: "22:00:00",
        group_type: "Choeur complet",
        event_id: null,
        google_updated_at: null,
        created_at: null,
        updated_at: null,
      },
      onEdit: noop,
      onDelete: noop,
    }),
  );
  assert.match(html, /Répétition générale/);
  assert.match(html, /Choeur complet/);
  assert.match(html, /Mardi 6 octobre 2026/);
  assert.match(html, /20 h – 22 h/);
  assert.match(html, /Salle paroissiale, Barr/);
  assert.match(html, /Modifier<span class="sr-only"> « Répétition générale »/);
  // « Supprimer… » lives in the « Plus d'actions » menu, not on the row.
  assert.match(html, /Plus d(&#x27;|')actions pour « Répétition générale »/);
  assert.doesNotMatch(html, />Supprimer</);
  assert.doesNotMatch(html, /border-danger/);
  assert.doesNotMatch(html, /Google Agenda/);
}

// --- A synced rehearsal says where it comes from ---
{
  const html = renderToStaticMarkup(
    createElement(RehearsalRow, {
      rehearsal: {
        id: "r2",
        name: "Pupitre des femmes",
        place: "Salle",
        date: "2026-10-07",
        start_time: "19:30:00",
        end_time: "21:00:00",
        group_type: "Femmes",
        event_id: "google-123",
        google_updated_at: "2026-10-01T10:00:00Z",
        created_at: null,
        updated_at: null,
      },
      onEdit: noop,
      onDelete: noop,
    }),
  );
  assert.match(html, /Google Agenda/);
  assert.match(html, /19 h 30 – 21 h/);
}

// --- An event row: period, visibility, type, contact, link ---
{
  const html = renderToStaticMarkup(
    createElement(EventRow, {
      event: {
        id: "e1",
        title: "Week-end chantant",
        date_from: "2026-08-14",
        date_to: "2026-08-16",
        time: "09:30:00",
        location: "Mittelbergheim",
        responsible_name: "Anne",
        responsible_email: "anne@example.org",
        event_type: "sejour",
        description: "Apportez vos partitions et de quoi pique-niquer.",
        link: "https://example.org/inscription",
        is_public: true,
        created_at: "",
        updated_at: "",
      },
      onEdit: noop,
      onDelete: noop,
    }),
  );
  assert.match(html, /Week-end chantant/);
  assert.match(html, /Séjour/);
  assert.match(html, />Public</);
  assert.match(html, /Du 14 au 16 août 2026/);
  assert.match(html, /9 h 30/);
  assert.match(html, /Anne \(anne@example.org\)/);
  assert.match(html, /Apportez vos partitions/);
  assert.match(html, /href="https:\/\/example.org\/inscription"/);
  assert.match(html, /Modifier<span class="sr-only"> « Week-end chantant »/);
  // « Supprimer… » lives in the « Plus d'actions » menu, not on the row.
  assert.match(html, /Plus d(&#x27;|')actions pour « Week-end chantant »/);
  assert.doesNotMatch(html, />Supprimer</);
  assert.doesNotMatch(html, /border-danger/);
  assert.doesNotMatch(html, /sejour/);
}

// --- A members-only event with the bare minimum ---
{
  const html = renderToStaticMarkup(
    createElement(EventRow, {
      event: {
        id: "e2",
        title: "Vente de Noël",
        date_from: "2026-12-05",
        date_to: null,
        time: "10:00:00",
        location: "Marché",
        responsible_name: "Paul",
        responsible_email: null,
        event_type: "vente",
        description: null,
        link: null,
        is_public: false,
        created_at: "",
        updated_at: "",
      },
      onEdit: noop,
      onDelete: noop,
    }),
  );
  assert.match(html, />Membres</);
  assert.match(html, /Samedi 5 décembre 2026/);
  assert.match(html, />Vente</);
  assert.doesNotMatch(html, /Ouvrir le lien/);
  assert.doesNotMatch(html, /\(\)/, "no empty parentheses without an e-mail");
}

console.log("season components: all assertions passed");

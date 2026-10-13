// Static renders of the cards of « Réglages du site » (no DOM, no queries):
// what an admin reads on one, and the names of its three actions.
import { DEFAULT_SITE_SETTINGS } from "@repo/domain/utils/siteSettings";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SettingCard } from "./SettingCard";

const noop = () => {};
const NBSP = " ";
const defaults = DEFAULT_SITE_SETTINGS;

const card = (
  props: Partial<Parameters<typeof SettingCard>[0]> &
    Pick<Parameters<typeof SettingCard>[0], "settingKey" | "value">,
) =>
  renderToStaticMarkup(
    createElement(SettingCard, {
      invalid: false,
      editable: true,
      onEdit: noop,
      onHistory: noop,
      ...props,
    }),
  );

/** The attributes of the button whose text contains `label`. */
const openingTag = (html: string, label: string) => {
  const part = html.split("<button").find((chunk) => chunk.includes(label));
  assert.ok(part, `a button named ${label}`);
  return part.slice(0, part.indexOf(">"));
};

// --- A setting never saved: the original values, three actions, no primary ---
{
  const html = card({ settingKey: "contact", value: defaults.contact });
  assert.match(html, /<h2[^>]*>Coordonnées<\/h2>/);
  assert.match(html, /L(&#x27;|')adresse e-mail qui reçoit les messages/);
  assert.match(html, /<dl/);
  assert.match(html, />Adresse e-mail<\/dt>/);
  assert.match(html, /lebontemperament@gmail\.com/);
  assert.match(html, /3 Rue Clemenceau, 67700 Saverne/);
  assert.match(html, /Valeurs d(&#x27;|')origine du site/);
  // Three actions, named after the card for assistive technology.
  assert.match(html, /Modifier<span class="sr-only"> « Coordonnées »<\/span>/);
  assert.match(html, /Voir sur le site/);
  assert.match(html, /href="[^"]*\/contact"[^>]*target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /Historique<span class="sr-only"> « Coordonnées »/);
  // Nothing is disabled, and no filled teal button: the dialogs hold the primary.
  assert.doesNotMatch(html, /\sdisabled=""/);
  assert.doesNotMatch(html, /bg-primary-strong/);
  assert.doesNotMatch(html, /Réservé aux superadmins/);
  assert.doesNotMatch(html, /La valeur enregistrée/);
  // Tokens only.
  assert.doesNotMatch(html, /bg-white|text-gray|border-gray|#[0-9a-f]{6}/i);
}

// --- The contact details for a plain admin: off, with the reason beside it ---
{
  const html = card({
    settingKey: "contact",
    value: defaults.contact,
    editable: false,
  });
  assert.match(
    html,
    /Réservé aux superadmins : cette adresse reçoit les messages du formulaire de contact\./,
  );
  const modify = openingTag(html, "Modifier");
  assert.match(modify, /\sdisabled=""/);
  assert.match(modify, /aria-describedby="setting-contact-locked"/);
  assert.match(html, /id="setting-contact-locked"/);
  // Reading and the history stay available.
  assert.match(html, /Voir sur le site/);
  assert.doesNotMatch(openingTag(html, "Historique"), /\sdisabled=""/);
}

// --- Saved: who and when ---
{
  const html = card({
    settingKey: "legal_notice",
    value: defaults.legal_notice,
    saved: { updatedAt: "2026-10-12T10:30:00Z", updatedBy: "Marie Martin" },
  });
  assert.match(html, /Modifié le 12 octobre 2026 par Marie Martin/);
  assert.doesNotMatch(html, /Valeurs d(&#x27;|')origine du site/);
  assert.match(html, />Direction de la publication<\/dt>/);
  assert.match(html, />Registre des associations<\/dt>/);
  assert.match(html, /Non renseigné/);
  assert.match(html, /\/mentions-legales"/);
}

// --- Saved but no longer valid: a warning, and the original values ---
{
  const html = card({
    settingKey: "joining",
    value: defaults.joining,
    saved: { updatedAt: "2026-10-12T10:30:00Z", updatedBy: "Marie Martin" },
    invalid: true,
  });
  assert.match(html, /data-tone="warning"/);
  assert.match(
    html,
    /La valeur enregistrée n(&#x27;|')est plus valide : le site affiche les valeurs d(&#x27;|')origine\./,
  );
  assert.match(html, /Valeurs d(&#x27;|')origine du site/);
  assert.doesNotMatch(html, /Modifié le/);
  // Long texts are clamped on the card; the eight facts have plain names.
  assert.match(html, /line-clamp-2/);
  for (const label of [
    "Présentation",
    "Lieux",
    "Horaires",
    "Âges",
    "Audition",
    "Lecture de la musique",
    "Cotisation",
    "Inscription",
  ]) {
    assert.match(html, new RegExp(`>${label}</dt>`), label);
  }
  assert.match(
    html,
    /Les réponses de la FAQ se modifient dans « Rejoindre et FAQ »/,
  );
}

// --- Social links: the network, then its link; none shown says so ---
{
  const html = card({
    settingKey: "social_links",
    value: defaults.social_links,
  });
  assert.match(html, />Instagram<\/dt>/);
  assert.match(
    html,
    /href="https:\/\/www\.instagram\.com\/lebontemperament_\/"[^>]*target="_blank"/,
  );
  assert.equal(html.match(/<dt/g)?.length, 4);

  const none = card({ settingKey: "social_links", value: { links: [] } });
  assert.doesNotMatch(none, /<dl/);
  assert.match(none, /Aucun lien n(&#x27;|')est affiché sur le site\./);
}

// --- Donations: the amounts as « 5 € 🥤 … », one line each ---
{
  const html = card({ settingKey: "donations", value: defaults.donations });
  assert.match(html, /<h2[^>]*>Dons<\/h2>/);
  assert.match(html, new RegExp(`5${NBSP}€ 🥤 Achat de`));
  assert.match(html, new RegExp(`2${NBSP}000${NBSP}€ 🥁`));
  assert.equal(html.match(/<li class="line-clamp-1/g)?.length, 7);
  assert.match(html, />Sélectionné à l(&#x27;|')ouverture<\/dt>/);
  assert.match(html, new RegExp(`20${NBSP}€`));
  assert.match(html, /\/don"/);
}

console.log("site-settings: all assertions passed");

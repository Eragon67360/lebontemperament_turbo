// Static renders of the tracking page's states (no DOM, no network): the
// page has a title, the dead-end state leads back to the site, and what the
// recipient reads is still there. Run with:
//   npx tsx --tsconfig tsconfig.test.json app/track/shared.test.ts
// (`jsx: react-jsx`: the app's `preserve` is for Next).
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DeliveredPanel,
  type Delivery,
  type DeliveryRecipient,
  RecipientSinglePanel,
  StatusPanel,
  StoppedOverlay,
  TrackPageError,
  TrackPageLoadingFallback,
} from "./shared";

const delivery: Delivery = {
  id: "00000000-0000-0000-0000-000000000001",
  public_token: "fake-token",
  latitude: null,
  longitude: null,
  is_tracking_active: false,
  expires_at: "2026-10-27T23:59:00.000Z",
  updated_at: "2026-10-27T08:00:00.000Z",
  scheduled_at: "2026-10-27T08:00:00.000Z",
  scheduled_end_at: "2026-10-27T11:00:00.000Z",
  is_delayed: false,
  delay_minutes: null,
  problem_message: null,
  current_recipient_id: null,
};

const recipient: DeliveryRecipient = {
  id: "00000000-0000-0000-0000-000000000002",
  delivery_id: delivery.id,
  label: "Prénom NOM · 12 rue de l’Exemple",
  scheduled_at: "2026-10-27T09:29:00.000Z",
};

const countH1 = (html: string) => (html.match(/<h1[\s>]/g) ?? []).length;

// The dead end: one title, the message, the way back to the site and to the
// contact page, and the refresh.
{
  const html = renderToStaticMarkup(
    createElement(TrackPageError, {
      message: "Ce lien de suivi a expiré.",
      onRetry: () => {},
    }),
  );
  assert.equal(countH1(html), 1);
  assert.match(html, /<h1[^>]*>Erreur de suivi<\/h1>/);
  assert.match(html, /Ce lien de suivi a expiré\./);
  assert.match(
    html,
    /<a[^>]*href="\/"[^>]*>[^<]*<svg[\s\S]*?Retour à l’accueil/,
  );
  assert.match(html, /<a[^>]*href="\/contact"[^>]*>Nous contacter<\/a>/);
  assert.match(html, /<button[^>]*>Réactualiser la page<\/button>/);
}

// The recipient's panel is titled « Votre livraison » then who it is for,
// and says where the round stands.
{
  const html = renderToStaticMarkup(
    createElement(RecipientSinglePanel, {
      recipient,
      delivery,
      etaForCurrentRecipient: null,
      status: "pending",
    }),
  );
  assert.equal(countH1(html), 1);
  assert.match(
    html,
    /<h1[^>]*>(?:<span[^>]*>Votre livraison<\/span>)(?:<span[^>]*>Prénom NOM · 12 rue de l’Exemple<\/span>)<\/h1>/,
  );
  assert.match(html, /Prévu/);
  // React writes the apostrophe as `&#x27;`.
  assert.match(html, /Le suivi en direct s(?:'|&#x27;)activera/);
}
{
  const html = renderToStaticMarkup(
    createElement(RecipientSinglePanel, {
      recipient,
      delivery: { ...delivery, is_tracking_active: true },
      etaForCurrentRecipient: null,
      status: "started",
    }),
  );
  assert.match(html, /Tournée en cours/);
  assert.match(html, /Notre tournée a commencé/);
}

// Alerts: nothing without one; the delay with its minutes; the problem text.
assert.equal(
  renderToStaticMarkup(createElement(StatusPanel, { delivery })),
  "",
);
{
  const html = renderToStaticMarkup(
    createElement(StatusPanel, {
      delivery: { ...delivery, is_delayed: true, delay_minutes: 20 },
    }),
  );
  assert.match(html, /role="status"/);
  assert.match(html, /En retard/);
  assert.match(html, /~20 min/);
}
{
  const html = renderToStaticMarkup(
    createElement(StatusPanel, {
      delivery: { ...delivery, problem_message: "Route barrée." },
    }),
  );
  assert.match(html, /Problème/);
  assert.match(html, /Route barrée\./);
}

// The delivered and paused states each carry the page's title.
{
  const html = renderToStaticMarkup(
    createElement(DeliveredPanel, {
      deliveredAt: "2026-10-27T09:31:00.000Z",
      label: recipient.label,
    }),
  );
  assert.equal(countH1(html), 1);
  assert.match(html, /<h1[^>]*>Livré<\/h1>/);
  assert.match(html, /Prénom NOM · 12 rue de l’Exemple – livré à/);
}
{
  const html = renderToStaticMarkup(
    createElement(StoppedOverlay, { delivery }),
  );
  assert.equal(countH1(html), 1);
  assert.match(html, /<h1[^>]*>Suivi en direct interrompu<\/h1>/);
}

// Loading is announced as a status.
assert.match(
  renderToStaticMarkup(createElement(TrackPageLoadingFallback)),
  /role="status"[\s\S]*Chargement du suivi en direct/,
);

console.log("track/shared: all tests passed");

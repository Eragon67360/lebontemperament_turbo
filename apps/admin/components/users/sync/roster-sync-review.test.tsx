// Static render of « Synchronisation de la liste des membres » while the
// review loads (no DOM, no fetch: the queries stay pending on the server):
// the three steps are the shared Stepper, the first one current, and
// nothing on the screen is drawn with the old `primary-600` alias.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RosterSyncReview } from "./RosterSyncReview";

const client = new QueryClient();
const html = renderToStaticMarkup(
  createElement(
    QueryClientProvider,
    { client },
    createElement(RosterSyncReview),
  ),
);
// Each query scheduled its garbage collection; drop them so Node exits.
client.clear();

// --- The shared Stepper: an ordered list named for the screen ---
const stepper = html.match(
  /<ol [^>]*aria-label="Étapes de la synchronisation"[^>]*>.*?<\/ol>/,
)?.[0];
assert.ok(
  stepper,
  "the steps are an <ol> named « Étapes de la synchronisation »",
);
const items = stepper.match(/<li [^>]*>/g) ?? [];
assert.equal(items.length, 3);
assert.match(items[0] ?? "", /aria-current="step"/);
assert.match(items[0] ?? "", /data-state="current"/);
assert.match(items[1] ?? "", /data-state="todo"/);
assert.match(items[2] ?? "", /data-state="todo"/);
assert.match(stepper, /Étape en cours : <\/span>Vérifier/);
assert.match(stepper, /Étape à venir : <\/span>Choisir/);
assert.match(stepper, /Étape à venir : <\/span>Appliquer/);

// --- The current step's number is white on the filled teal ---
assert.match(stepper, /bg-primary-strong text-primary-foreground/);

// --- No `primary-600` anywhere on the screen ---
assert.doesNotMatch(html, /primary-600/);

// --- The page still says what it is and loads the review ---
assert.match(html, /Synchronisation de la liste des membres/);
assert.match(html, /Lecture du tableau des membres/);

console.log("components/users/sync: ok");

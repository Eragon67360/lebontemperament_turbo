// Notices and screen readers (static renders, no DOM). `Alert` used to carry
// `role="alert"` on every instance and an `h5` title, so a « Pour
// information » box interrupted the reader and jumped the heading order.
// Now: `Alert` is static, `Callout` is announced only when the caller asks,
// and neither adds a heading. The sync screens' seven notices are Callouts.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Callout } from "./callout";

// --- Alert: a static box, its title a bold line, not a heading ---
{
  const html = renderToStaticMarkup(
    <Alert variant="info">
      <AlertTitle>Pour information</AlertTitle>
      <AlertDescription>Rien d’urgent.</AlertDescription>
    </Alert>,
  );
  assert.doesNotMatch(html, /role="alert"/);
  assert.doesNotMatch(html, /<h[1-6]/, "a notice is not a heading");
  assert.match(html, /<p[^>]*>Pour information<\/p>/);
}

// --- Callout: announced only on request, title never a heading ---
{
  const quiet = renderToStaticMarkup(
    <Callout tone="warning" title="2 points à vérifier">
      <p>Ligne 12 : voix inconnue.</p>
    </Callout>,
  );
  assert.doesNotMatch(quiet, /role=/);
  assert.doesNotMatch(quiet, /<h[1-6]/);
  assert.match(quiet, /data-tone="warning"/);

  const failure = renderToStaticMarkup(
    <Callout tone="danger" role="alert" title="Le tableau ne peut pas être lu">
      <p>Corrigez le tableau.</p>
    </Callout>,
  );
  assert.match(failure, /^<div[^>]*role="alert"/);
  assert.match(failure, /data-tone="danger"/);
}

// --- The sync screens no longer use the legacy Alert ---
{
  const root = new URL("../../", import.meta.url);
  for (const file of [
    "components/travail/DriveSyncSection.tsx",
    "components/users/sync/RosterSyncReview.tsx",
    "components/users/sync/RosterSyncGroups.tsx",
  ]) {
    const source = readFileSync(fileURLToPath(new URL(file, root)), "utf8");
    assert.doesNotMatch(
      source,
      /components\/ui\/alert"/,
      `${file}: notices are Callouts (role="alert" only for a failure)`,
    );
  }
}

console.log("notices: ok");

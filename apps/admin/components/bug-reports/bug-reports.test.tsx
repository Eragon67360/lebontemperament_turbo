// Static renders of a « Signalements » row (no DOM, no queries): what the
// superadmin reads, the status word and the accessible name of the select.
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { reportOrigin } from "../../utils/bug-reports/status";
import { BugReportRow } from "./BugReportRow";

const noop = () => {};

const report = {
  id: "b1",
  title: "Le bouton Enregistrer ne répond pas",
  description: "Sur la page des concerts, rien ne se passe.",
  status: "in_progress" as const,
  created_at: "2026-10-06T12:00:00Z",
  profiles: { email: "anne@example.org", display_name: "Anne" },
};

// --- A row: title, status word, author, excerpt, the status select ---
{
  const html = renderToStaticMarkup(
    createElement(BugReportRow, {
      report,
      onStatusChange: noop,
      details: createElement("button", { type: "button" }, "Voir les détails"),
    }),
  );
  assert.match(html, /Le bouton Enregistrer ne répond pas/);
  assert.match(html, /En cours/);
  assert.match(html, /Signalé par/);
  assert.match(html, /Anne/);
  assert.match(html, /octobre 2026/);
  assert.match(html, /rien ne se passe/);
  assert.match(
    html,
    /aria-label="Statut du signalement « Le bouton Enregistrer ne répond pas »"/,
  );
  assert.match(html, /Voir les détails/);
  // Tokens only: no raw hue on the row.
  assert.doesNotMatch(html, /(bg|text|border)-(gray|yellow|blue|green)-\d/);
}

// --- Without a display name, the e-mail says who reported it ---
{
  const html = renderToStaticMarkup(
    createElement(BugReportRow, {
      report: {
        ...report,
        status: "pending",
        profiles: { email: "paul@example.org", display_name: null },
      },
      onStatusChange: noop,
    }),
  );
  assert.match(html, /paul@example\.org/);
  assert.match(html, /En attente/);
}

// --- A report from the app with screenshots says so after the date ---
{
  const html = renderToStaticMarkup(
    createElement(BugReportRow, {
      report: {
        ...report,
        source: "app" as const,
        screenshot_paths: ["u1/a.jpg", "u1/b.jpg"],
      },
      onStatusChange: noop,
    }),
  );
  assert.match(html, /depuis l&#x27;application, 2 captures/);
}

// --- reportOrigin: nothing for an admin report without screenshots ---
assert.equal(reportOrigin({ source: "admin", screenshot_paths: [] }), null);
assert.equal(reportOrigin({}), null);
assert.equal(reportOrigin({ screenshot_paths: ["u1/a.jpg"] }), "1 capture");
assert.equal(reportOrigin({ source: "app" }), "depuis l'application");

console.log("components/bug-reports: ok");

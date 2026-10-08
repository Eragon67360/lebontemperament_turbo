import assert from "node:assert/strict";
import {
  BUG_REPORT_STATUSES,
  bugReportStatusLabel,
  bugReportStatusTone,
  messageCountLabel,
  personName,
} from "./status";

// --- Each status has one word and one tone, shared by the three screens ---
assert.deepEqual(
  BUG_REPORT_STATUSES.map((status) => [
    status,
    bugReportStatusLabel(status),
    bugReportStatusTone(status),
  ]),
  [
    ["pending", "En attente", "warning"],
    ["in_progress", "En cours", "info"],
    ["resolved", "Résolu", "success"],
  ],
);

// --- An unknown value reads as « En attente », never as the raw enum ---
assert.equal(bugReportStatusLabel("archived"), "En attente");
assert.equal(bugReportStatusTone("archived"), "warning");

// --- Counts ---
assert.equal(messageCountLabel(1), "1 message");
assert.equal(messageCountLabel(4), "4 messages");

// --- Who: the display name, else the e-mail ---
assert.equal(
  personName({ display_name: "Anne", email: "anne@example.org" }),
  "Anne",
);
assert.equal(
  personName({ display_name: null, email: "anne@example.org" }),
  "anne@example.org",
);
assert.equal(personName(null), "Quelqu'un");

console.log("bug-reports/status: ok");

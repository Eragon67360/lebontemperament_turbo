// What /api/bug-messages and /api/bug-messages/mark-read accept (CODE-004):
// what the dialogs send, and never the sender, receiver, report or read flag.
import assert from "node:assert/strict";
import type { z } from "zod";
import { parsePatchBody } from "../anniversary/patchSchemas";
import {
  bugMessageCreateSchema,
  bugMessageDeleteSchema,
  bugMessagePatchSchema,
  markReadSchema,
} from "./apiSchemas";

const REPORT = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
const MESSAGE = "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b";
const OTHER = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

// --- What the dialogs send is accepted ---
assert.deepEqual(
  parsePatchBody(bugMessageCreateSchema, {
    bug_report_id: REPORT,
    message: "Le bouton ne répond plus",
  }),
  {
    ok: true,
    data: { bug_report_id: REPORT, message: "Le bouton ne répond plus" },
  },
);
assert.deepEqual(parsePatchBody(markReadSchema, { bug_report_id: REPORT }), {
  ok: true,
  data: { bug_report_id: REPORT },
});
assert.deepEqual(
  parsePatchBody(bugMessagePatchSchema, { id: MESSAGE, message: " Corrigé " }),
  { ok: true, data: { id: MESSAGE, message: "Corrigé" } },
);
assert.deepEqual(parsePatchBody(bugMessageDeleteSchema, { id: MESSAGE }), {
  ok: true,
  data: { id: MESSAGE },
});

// --- The columns the route sets itself are refused, by name ---
for (const column of [
  "sender_id",
  "receiver_id",
  "is_read",
  "id",
  "created_at",
]) {
  assert.deepEqual(
    parsePatchBody(bugMessageCreateSchema, {
      bug_report_id: REPORT,
      message: "Bonjour",
      [column]: column === "is_read" ? true : OTHER,
    }),
    { ok: false, status: 400, error: `Champs non modifiables : ${column}` },
    `create: ${column}`,
  );
}
for (const column of ["sender_id", "receiver_id", "bug_report_id", "is_read"]) {
  assert.deepEqual(
    parsePatchBody(bugMessagePatchSchema, {
      id: MESSAGE,
      message: "Bonjour",
      [column]: column === "is_read" ? true : OTHER,
    }),
    { ok: false, status: 400, error: `Champs non modifiables : ${column}` },
    `patch: ${column}`,
  );
}
assert.deepEqual(
  parsePatchBody(markReadSchema, { bug_report_id: REPORT, receiver_id: OTHER }),
  { ok: false, status: 400, error: "Champs non modifiables : receiver_id" },
);

// --- Wrong or missing values, by field ---
const refusals: [z.ZodType, unknown, string][] = [
  [
    bugMessageCreateSchema,
    { message: "Bonjour" },
    "Champs invalides : bug_report_id",
  ],
  [
    bugMessageCreateSchema,
    { bug_report_id: "42", message: "Bonjour" },
    "Champs invalides : bug_report_id",
  ],
  [
    bugMessageCreateSchema,
    { bug_report_id: REPORT, message: "   " },
    "Champs invalides : message",
  ],
  [bugMessagePatchSchema, { id: MESSAGE }, "Champs invalides : message"],
  [markReadSchema, {}, "Champs invalides : bug_report_id"],
  [markReadSchema, { bug_report_id: null }, "Champs invalides : bug_report_id"],
  [bugMessageDeleteSchema, { id: 42 }, "Champs invalides : id"],
  [bugMessageCreateSchema, undefined, "Corps de requête invalide"],
];
for (const [schema, body, error] of refusals) {
  assert.deepEqual(
    parsePatchBody(schema, body),
    { ok: false, status: 400, error },
    JSON.stringify(body),
  );
}

console.log("bug-reports apiSchemas: all assertions passed");

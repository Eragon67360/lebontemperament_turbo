// What /api/rehearsals, /api/rehearsals/[id] and /api/events accept
// (CODE-004): the payloads the dialogs build (toRehearsalPayloads,
// toEventPayload) pass as built; other columns and bad values are refused.
import assert from "node:assert/strict";
import type { z } from "zod";
import { parsePatchBody } from "../anniversary/patchSchemas";
import type { EventFormValues, RehearsalFormValues } from "../formSchemas";
import {
  eventCreateSchema,
  eventDeleteSchema,
  eventPatchSchema,
  rehearsalCreateSchema,
  rehearsalPatchSchema,
  rehearsalSeriesSchema,
} from "./apiSchemas";
import { toEventPayload, toRehearsalPayloads } from "./schedule";

const ID = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";

function accepts(schema: z.ZodType, body: unknown, label: string) {
  assert.deepEqual(
    parsePatchBody(schema, body),
    { ok: true, data: body },
    label,
  );
}

function refuses(
  schema: z.ZodType,
  body: unknown,
  error: string,
  label: string,
) {
  assert.deepEqual(
    parsePatchBody(schema, body),
    { ok: false, status: 400, error },
    label,
  );
}

// --- Rehearsals: what the dialog sends ---
const rehearsalForm: RehearsalFormValues = {
  name: "Répétition générale",
  group_type: "Choeur complet",
  date: new Date(2026, 10, 3),
  place: "Salle des fêtes",
  address: "1 rue de l'Exemple, 67000 Strasbourg",
  room: "Salle 12",
  start_time: "19:30",
  end_time: "21:30",
  repeat: false,
  repeat_interval: 1,
  repeat_until: undefined,
};
const [single] = toRehearsalPayloads(rehearsalForm);
accepts(rehearsalCreateSchema, single, "one rehearsal");
accepts(
  rehearsalCreateSchema,
  toRehearsalPayloads({ ...rehearsalForm, address: "", room: "" })[0],
  "address and room left empty (null)",
);
const series = toRehearsalPayloads({
  ...rehearsalForm,
  repeat: true,
  repeat_interval: 1,
  repeat_until: new Date(2026, 10, 24),
});
assert.equal(series.length, 4);
accepts(rehearsalSeriesSchema, series, "a weekly series");
// The edit sends the form's row; the hook keeps the id for the path.
accepts(rehearsalPatchSchema, single, "edit");
accepts(rehearsalPatchSchema, { start_time: "19:00:00" }, "a time read back");

// --- Rehearsals: other columns and bad values are refused ---
for (const column of [
  "id",
  "event_id",
  "google_updated_at",
  "created_at",
  "updated_at",
]) {
  refuses(
    rehearsalCreateSchema,
    { ...single, [column]: "x" },
    `Champs non modifiables : ${column}`,
    `create: ${column}`,
  );
  refuses(
    rehearsalPatchSchema,
    { name: "Répétition", [column]: "x" },
    `Champs non modifiables : ${column}`,
    `patch: ${column}`,
  );
}
for (const [field, value] of [
  ["group_type", "Basses"],
  ["date", "3/11/2026"],
  ["start_time", "7pm"],
  ["end_time", "25:00"],
  ["name", "   "],
  ["name", "x".repeat(256)],
  ["place", null],
  ["address", 42],
] as const) {
  refuses(
    rehearsalCreateSchema,
    { ...single, [field]: value },
    `Champs invalides : ${field}`,
    `create: ${field} = ${String(value).slice(0, 20)}`,
  );
}
const withoutName: Record<string, unknown> = { ...single };
delete withoutName.name;
refuses(
  rehearsalCreateSchema,
  withoutName,
  "Champs invalides : name",
  "no name",
);
refuses(rehearsalSeriesSchema, [], "Corps de requête invalide", "no row");
refuses(
  rehearsalSeriesSchema,
  [single, { ...single, created_at: "2026-01-01" }],
  "Champs non modifiables : created_at",
  "series: an unknown key in one row",
);
refuses(
  rehearsalSeriesSchema,
  [single, { ...single, date: "x" }],
  "Champs invalides : 1.date",
  "series: a bad date in one row",
);
refuses(rehearsalPatchSchema, {}, "Aucun champ à modifier", "empty edit");
refuses(
  rehearsalCreateSchema,
  undefined,
  "Corps de requête invalide",
  "no JSON",
);

// --- Events: what the dialog sends ---
const eventForm: EventFormValues = {
  title: "Week-end choral",
  date_from: new Date(2026, 10, 14),
  date_to: new Date(2026, 10, 16),
  time: "09:30",
  location: "Centre de vacances",
  responsible_name: "Prénom NOM",
  responsible_email: "member@example.com",
  event_type: "sejour",
  description: "Hébergement et repas compris",
  link: "https://www.example.com/inscription",
  is_public: true,
};
const event = toEventPayload(eventForm);
accepts(eventCreateSchema, event, "an event");
const sparse = toEventPayload({
  ...eventForm,
  date_to: undefined,
  responsible_email: "",
  description: "",
  link: "",
  is_public: false,
});
assert.equal(sparse.date_to, null);
accepts(eventCreateSchema, sparse, "an event with its options left empty");
accepts(eventPatchSchema, toEventPayload(eventForm, ID), "edit");
accepts(eventPatchSchema, { id: ID, is_public: false }, "one field");
accepts(eventDeleteSchema, { id: ID }, "delete");

// --- Events: other columns and bad values are refused ---
for (const column of ["id", "created_at", "updated_at"]) {
  refuses(
    eventCreateSchema,
    { ...event, [column]: column === "id" ? ID : "2026-01-01" },
    `Champs non modifiables : ${column}`,
    `create: ${column}`,
  );
}
for (const column of ["created_at", "updated_at", "documents"]) {
  refuses(
    eventPatchSchema,
    { id: ID, title: "Week-end", [column]: "x" },
    `Champs non modifiables : ${column}`,
    `patch: ${column}`,
  );
}
for (const [field, value] of [
  ["event_type", "fete"],
  ["responsible_email", "pas-un-email"],
  ["is_public", "true"],
  ["time", "9h30"],
  ["date_to", "16/11/2026"],
  ["title", ""],
] as const) {
  refuses(
    eventCreateSchema,
    { ...event, [field]: value },
    `Champs invalides : ${field}`,
    `create: ${field}`,
  );
}
refuses(eventPatchSchema, { id: ID }, "Aucun champ à modifier", "empty edit");
refuses(
  eventPatchSchema,
  { title: "Week-end" },
  "Champs invalides : id",
  "edit without its id",
);
refuses(
  eventDeleteSchema,
  { id: ID, title: "x" },
  "Champs non modifiables : title",
  "delete with more than the id",
);

console.log("season apiSchemas: all assertions passed");

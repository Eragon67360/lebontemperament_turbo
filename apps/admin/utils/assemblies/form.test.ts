import type { GeneralAssembly } from "@/hooks/useAssemblies";
import assert from "node:assert/strict";
import {
  formForNext,
  formFromAssembly,
  inputFromForm,
  isSameForm,
} from "./form";
import { assemblyCreateSchema, assemblyPatchSchema } from "./schemas";

const AG_2026: GeneralAssembly = {
  id: "8d1f9a52-3c1e-4c55-9a39-2f8a8f6f0a11",
  held_at: "2026-03-14T18:00:00+00:00",
  place: "Freihof, Wangen",
  practical_note: "Le parking se fera devant la salle des fêtes.",
  reminders: "- Un membre ne peut avoir que **deux procurations maximum**.",
  voting_rights: "Ont le droit de vote…",
  agenda: "Élection du nouveau CA.",
  afterwards: null,
  convocation_document_id: "0f4a7c1e-1b2c-4d3e-8f90-123456789abc",
  proxy_document_id: null,
  status: "published",
  created_at: "2026-01-01T00:00:00+00:00",
  updated_at: "2026-01-01T00:00:00+00:00",
};

// Editing: the Paris wall clock and every text.
const form = formFromAssembly(AG_2026);
assert.equal(form.heldAt, "2026-03-14T19:00");
assert.equal(form.afterwards, "");
assert.equal(form.published, true);
const back = inputFromForm(form);
assert.ok(back.ok);
assert.equal(back.value.held_at, "2026-03-14T18:00:00.000Z");
assert.equal(back.value.afterwards, null);
assert.equal(back.value.status, "published");
assert.equal(
  back.value.convocation_document_id,
  AG_2026.convocation_document_id,
);
assert.ok(assemblyCreateSchema.safeParse(back.value).success);

// Next year: same place and texts, no date, no documents, a draft.
const next = formForNext(AG_2026);
assert.equal(next.place, "Freihof, Wangen");
assert.equal(next.agenda, "Élection du nouveau CA.");
assert.equal(next.heldAt, "");
assert.equal(next.convocationId, "");
assert.equal(next.published, false);
assert.equal(isSameForm(next, formForNext(AG_2026)), true);
assert.equal(isSameForm(next, form), false);
assert.equal(formForNext(null).place, "");

// What the form refuses.
const missing = inputFromForm(next);
assert.equal(missing.ok, false);
assert.ok(!missing.ok && missing.errors.heldAt);
const noPlace = inputFromForm({ ...form, place: "  " });
assert.ok(!noPlace.ok && noPlace.errors.place);
const tooLong = inputFromForm({ ...form, agenda: "x".repeat(3001) });
assert.ok(!tooLong.ok && tooLong.errors.agenda);

// The API: unknown keys refused, empty text stored as null, a patch needs a field.
assert.equal(
  assemblyCreateSchema.safeParse({ ...back.value, id: AG_2026.id }).success,
  false,
);
const blank = assemblyPatchSchema.safeParse({ reminders: "   " });
assert.ok(blank.success && blank.data.reminders === null);
assert.equal(assemblyPatchSchema.safeParse({}).success, false);
assert.equal(
  assemblyPatchSchema.safeParse({ held_at: "2027-03-13 19:00" }).success,
  false,
);
assert.equal(
  assemblyPatchSchema.safeParse({ status: "archived" }).success,
  false,
);

console.log("assemblies/form: all assertions passed");

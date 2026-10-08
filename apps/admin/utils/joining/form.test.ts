import assert from "node:assert/strict";
import { faqInput, faqValues, slotSentence, validateFaq } from "./form";
import { faqCreateSchema, faqPatchSchema, slotCreateSchema } from "./schemas";

const slot = {
  group_name: "Pupitres de femmes",
  day: "mercredi",
  time_label: "20 h 30 – 22 h",
  place: "à Nordheim",
  rhythm: "toutes les deux semaines",
};
// The same sentence as the website's /rejoindre.
assert.equal(
  slotSentence(slot),
  "Le mercredi, 20 h 30 – 22 h, à Nordheim (toutes les deux semaines).",
);
assert.ok(slotCreateSchema.safeParse(slot).success);
assert.equal(slotCreateSchema.safeParse({ ...slot, day: " " }).success, false);

// A question without a link.
const plain = faqValues(null);
assert.deepEqual(validateFaq({ ...plain, question: "Q", answer: "A" }), {});
const input = faqInput({ ...plain, question: "Q", answer: "A" });
assert.deepEqual(input, {
  question: "Q",
  answer: "A",
  link_href: null,
  link_label: null,
});
assert.ok(faqCreateSchema.safeParse(input).success);

// Links: valid targets only, and always with their text.
const linked = {
  question: "Q",
  answer: "A",
  link_href: "/rejoindre",
  link_label: "",
};
assert.ok(validateFaq(linked).link_label);
assert.ok(
  validateFaq({ ...linked, link_href: "javascript:x", link_label: "x" })
    .link_href,
);
assert.ok(validateFaq({ ...linked, link_href: "", link_label: "x" }).link_href);
assert.equal(
  faqCreateSchema.safeParse({
    question: "Q",
    answer: "A",
    link_href: "/x",
    link_label: null,
  }).success,
  false,
);
assert.equal(
  faqPatchSchema.safeParse({ link_href: "//evil", link_label: "x" }).success,
  false,
);
assert.ok(faqPatchSchema.safeParse({ sort_order: 20 }).success);
assert.ok(faqPatchSchema.safeParse({ status: "archived" }).success);
assert.equal(faqPatchSchema.safeParse({ status: "draft" }).success, false);

console.log("joining/form: all assertions passed");

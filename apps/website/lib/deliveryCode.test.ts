// Run with: npx tsx lib/deliveryCode.test.ts
import assert from "node:assert/strict";
import {
  formatDeliveryCode,
  isValidDeliveryCode,
  normalizeDeliveryCode,
} from "./deliveryCode";

// Normalising: case, dashes and spaces never matter.
assert.equal(normalizeDeliveryCode("abcd-2345"), "ABCD2345");
assert.equal(normalizeDeliveryCode(" ab cd 23 45 "), "ABCD2345");
assert.equal(normalizeDeliveryCode("ABCD2345"), "ABCD2345");
assert.equal(normalizeDeliveryCode("é/..%"), "");

// Validity: exactly 8 characters from the alphabet (no 0, O, 1, I, L).
assert.equal(isValidDeliveryCode("ABCD2345"), true);
assert.equal(isValidDeliveryCode("ABCD234"), false);
assert.equal(isValidDeliveryCode("ABCD23456"), false);
assert.equal(isValidDeliveryCode("ABCD0345"), false);
assert.equal(isValidDeliveryCode("ABCDO345"), false);
assert.equal(isValidDeliveryCode("ABCD1345"), false);
assert.equal(isValidDeliveryCode("ABCDI345"), false);
assert.equal(isValidDeliveryCode("ABCDL345"), false);
assert.equal(isValidDeliveryCode(""), false);

// Display form.
assert.equal(formatDeliveryCode("ABCD2345"), "ABCD-2345");
assert.equal(formatDeliveryCode("ABC"), "ABC");

console.log("deliveryCode: all tests passed");

import assert from "node:assert/strict";
import { isMissingFunctionError } from "./supabaseErrors";

assert.equal(isMissingFunctionError({ code: "PGRST202" }), true);
assert.equal(isMissingFunctionError({ code: "42883" }), true);
assert.equal(isMissingFunctionError({ code: "42501" }), false); // permission denied
assert.equal(isMissingFunctionError({ code: "PGRST301" }), false);
assert.equal(isMissingFunctionError({ code: null }), false);
assert.equal(isMissingFunctionError({}), false);
assert.equal(isMissingFunctionError(null), false);
assert.equal(isMissingFunctionError(undefined), false);

console.log("isMissingFunctionError: all assertions passed");

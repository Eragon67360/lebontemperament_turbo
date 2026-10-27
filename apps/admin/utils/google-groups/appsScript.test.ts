import assert from "node:assert/strict";
import { inspect } from "node:util";
import { appsScriptUrl } from "./appsScript";

// Fake values only: an example.com script URL and a made-up key.

const SCRIPT_URL = "https://script.example.com/macros/s/test-deployment/exec";
const KEY = "test-key-".repeat(5);

// --- GOOGLE_APPS_SCRIPT_KEY set: `key` joins the parameters ---
process.env.GOOGLE_APPS_SCRIPT_KEY = KEY;
{
  const url = appsScriptUrl(SCRIPT_URL, {
    action: "list-groups",
    groupEmail: "newsletter@example.com",
  });
  assert.equal(`${url.origin}${url.pathname}`, SCRIPT_URL);
  assert.deepEqual(
    [...url.searchParams],
    [
      ["action", "list-groups"],
      ["groupEmail", "newsletter@example.com"],
      ["key", KEY],
    ],
  );
}

// Empty parameters are left out (the admin route forwards what it was given).
assert.deepEqual(
  [...appsScriptUrl(SCRIPT_URL, { action: null, groupEmail: "" }).searchParams],
  [["key", KEY]],
);

// Surrounding spaces are not part of the key.
process.env.GOOGLE_APPS_SCRIPT_KEY = `  ${KEY}\n`;
assert.equal(appsScriptUrl(SCRIPT_URL, {}).searchParams.get("key"), KEY);

// The configured key always wins over a `key` among the parameters.
assert.deepEqual(
  appsScriptUrl(SCRIPT_URL, { key: "other" }).searchParams.getAll("key"),
  [KEY],
);

// --- Not set, or blank: no `key` parameter ---
delete process.env.GOOGLE_APPS_SCRIPT_KEY;
assert.deepEqual(
  [
    ...appsScriptUrl(SCRIPT_URL, { groupEmail: "newsletter@example.com" })
      .searchParams,
  ],
  [["groupEmail", "newsletter@example.com"]],
);
process.env.GOOGLE_APPS_SCRIPT_KEY = " ";
assert.equal(appsScriptUrl(SCRIPT_URL, {}).searchParams.has("key"), false);

// An invalid script URL throws before any key is added: what a caller would
// log (console.error prints the inspected error) can't carry it.
process.env.GOOGLE_APPS_SCRIPT_KEY = KEY;
assert.throws(
  () => appsScriptUrl("not a url", {}),
  (error: unknown) =>
    error instanceof TypeError && !inspect(error).includes(KEY),
);

console.log("✔ appsScriptUrl (admin)");

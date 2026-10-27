// Run with: npx tsx lib/appsScript.test.ts
//
// The newsletter sign-up (app/api/subscribe) asks the Apps Script whether an
// address is already in the Google Group, through appsScriptUrl: the key goes
// with the request when GOOGLE_APPS_SCRIPT_KEY is set, and only then. Fake
// values only: an example.com script URL and a made-up key.
import assert from "node:assert/strict";
import { inspect } from "node:util";
import { appsScriptUrl } from "./appsScript";

const SCRIPT_URL = "https://script.example.com/macros/s/test-deployment/exec";
const KEY = "test-key-".repeat(5);
const GROUP = { groupEmail: "newsletter@example.com" };

// --- GOOGLE_APPS_SCRIPT_KEY set: `key` joins the group ---
process.env.GOOGLE_APPS_SCRIPT_KEY = KEY;
{
  const url = appsScriptUrl(SCRIPT_URL, GROUP);
  assert.equal(`${url.origin}${url.pathname}`, SCRIPT_URL);
  assert.deepEqual(
    [...url.searchParams],
    [
      ["groupEmail", "newsletter@example.com"],
      ["key", KEY],
    ],
  );
}

// Surrounding spaces are not part of the key.
process.env.GOOGLE_APPS_SCRIPT_KEY = `  ${KEY}\n`;
assert.equal(appsScriptUrl(SCRIPT_URL, GROUP).searchParams.get("key"), KEY);

// Empty parameters are left out; the configured key always wins.
assert.deepEqual(
  [...appsScriptUrl(SCRIPT_URL, { groupEmail: "", key: "other" }).searchParams],
  [["key", KEY]],
);

// --- Not set, or blank: no `key` parameter ---
delete process.env.GOOGLE_APPS_SCRIPT_KEY;
assert.deepEqual(
  [...appsScriptUrl(SCRIPT_URL, GROUP).searchParams],
  [["groupEmail", "newsletter@example.com"]],
);
process.env.GOOGLE_APPS_SCRIPT_KEY = " ";
assert.equal(appsScriptUrl(SCRIPT_URL, GROUP).searchParams.has("key"), false);

// An invalid script URL throws before any key is added: what the route logs
// (console.error prints the inspected error) can't carry it.
process.env.GOOGLE_APPS_SCRIPT_KEY = KEY;
assert.throws(
  () => appsScriptUrl("not a url", GROUP),
  (error: unknown) =>
    error instanceof TypeError && !inspect(error).includes(KEY),
);

console.log("appsScriptUrl (website): ok");

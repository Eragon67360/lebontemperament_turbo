import assert from "node:assert/strict";
import { fetchGroupMemberEmails, GroupSourceError } from "./source";

// Everything here is fake: an example.com script URL, a made-up key and
// addresses. `fetch` is mocked, nothing leaves the process.

const SCRIPT_URL = "https://script.example.com/macros/s/test-deployment/exec";
const KEY = "test-key-".repeat(5);
const GROUP = "newsletter@example.com";

const requested: URL[] = [];
function mockFetch(impl: () => Response | Promise<Response>) {
  requested.length = 0;
  globalThis.fetch = (async (input: string | URL | Request) => {
    requested.push(new URL(String(input)));
    return impl();
  }) as typeof fetch;
}
const members = () =>
  Response.json({ success: true, data: ["member@example.com"] });

/** The single request made by fetchGroupMemberEmails(GROUP). */
async function requestFor(): Promise<URL> {
  requested.length = 0;
  assert.deepEqual(await fetchGroupMemberEmails(GROUP), ["member@example.com"]);
  assert.equal(requested.length, 1);
  const [url] = requested;
  assert.ok(url);
  assert.equal(`${url.origin}${url.pathname}`, SCRIPT_URL);
  assert.equal(url.searchParams.get("groupEmail"), GROUP);
  return url;
}

async function main() {
  process.env.GOOGLE_APPS_SCRIPT_URL = SCRIPT_URL;

  // --- GOOGLE_APPS_SCRIPT_KEY set: sent as `key`, without surrounding spaces ---
  mockFetch(members);
  process.env.GOOGLE_APPS_SCRIPT_KEY = KEY;
  assert.equal((await requestFor()).searchParams.get("key"), KEY);

  process.env.GOOGLE_APPS_SCRIPT_KEY = ` ${KEY}\n`;
  assert.equal((await requestFor()).searchParams.get("key"), KEY);

  // --- Not set, or blank: no `key` parameter at all ---
  delete process.env.GOOGLE_APPS_SCRIPT_KEY;
  assert.equal((await requestFor()).searchParams.has("key"), false);

  process.env.GOOGLE_APPS_SCRIPT_KEY = "   ";
  assert.equal((await requestFor()).searchParams.has("key"), false);

  // --- Failures never carry the key in their messages ---
  process.env.GOOGLE_APPS_SCRIPT_KEY = KEY;
  const failures: [string, () => Promise<Response>][] = [
    [
      "refused",
      async () => Response.json({ success: false, message: "Accès refusé" }),
    ],
    ["not JSON", async () => new Response("<html>sign in</html>")],
    ["HTTP error", async () => new Response("nope", { status: 500 })],
    [
      "network error",
      async () => {
        throw new TypeError(`fetch failed: ${String(requested[0])}`);
      },
    ],
  ];
  for (const [label, impl] of failures) {
    mockFetch(impl);
    await assert.rejects(fetchGroupMemberEmails(GROUP), (error) => {
      assert.ok(error instanceof GroupSourceError, label);
      assert.ok(!error.message.includes(KEY), `${label}: message`);
      assert.ok(!error.userMessage.includes(KEY), `${label}: userMessage`);
      return true;
    });
    assert.equal(requested[0]?.searchParams.get("key"), KEY, label);
  }

  // --- No script URL: nothing is requested ---
  delete process.env.GOOGLE_APPS_SCRIPT_URL;
  mockFetch(members);
  await assert.rejects(fetchGroupMemberEmails(GROUP), GroupSourceError);
  assert.equal(requested.length, 0);

  console.log("✔ google-groups source: the Apps Script key");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

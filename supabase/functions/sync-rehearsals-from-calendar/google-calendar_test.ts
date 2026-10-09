import { assertEquals } from "jsr:@std/assert@1";

import { patchEventLocations } from "./google-calendar.ts";

async function serviceAccountJson(): Promise<string> {
  const { privateKey } = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const der = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", privateKey),
  );
  const body = btoa(String.fromCharCode(...der)).replace(/(.{64})/g, "$1\n");
  return JSON.stringify({
    client_email: "sync@example.iam.gserviceaccount.com",
    private_key: `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`,
  });
}

Deno.test(
  "locations are patched quietly, one failure does not stop the rest",
  async () => {
    const requests: Array<{ url: string; method: string; body: string }> = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (input: Request | URL | string, init?: RequestInit) => {
      const url = String(input);
      const body = init?.body ? String(init.body) : "";
      requests.push({ url, method: init?.method ?? "GET", body });
      if (new URL(url).hostname === "oauth2.googleapis.com") {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "tok", expires_in: 3600 }),
          ),
        );
      }
      if (url.includes("/events/bad")) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: { message: "Forbidden" } }), {
            status: 403,
          }),
        );
      }
      return Promise.resolve(new Response("{}", { status: 200 }));
    };

    try {
      const results = await patchEventLocations({
        calendarId: "cal@group.calendar.google.com",
        serviceAccountJson: await serviceAccountJson(),
        patches: [
          { eventId: "bad", location: "A" },
          { eventId: "good", location: "Salle des fêtes, 67520 Wangen" },
        ],
      });
      assertEquals(
        results.map((r) => [r.eventId, r.ok]),
        [
          ["bad", false],
          ["good", true],
        ],
      );
      assertEquals(results[0].message, "403 Forbidden");

      const patches = requests.filter((r) => r.method === "PATCH");
      assertEquals(patches.length, 2);
      assertEquals(patches[1].url.includes("sendUpdates=none"), true);
      assertEquals(JSON.parse(patches[1].body), {
        location: "Salle des fêtes, 67520 Wangen",
      });
      // Nothing to write: no token, no request.
      requests.length = 0;
      assertEquals(
        await patchEventLocations({
          calendarId: "c",
          serviceAccountJson: "{}",
          patches: [],
        }),
        [],
      );
      assertEquals(requests.length, 0);
    } finally {
      globalThis.fetch = realFetch;
    }
  },
);

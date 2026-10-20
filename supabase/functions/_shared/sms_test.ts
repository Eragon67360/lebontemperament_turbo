// Run: npx -y deno test --node-modules-dir=none --allow-env supabase/functions/_shared/sms_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sendSms } from "./sms.ts";

const GATEWAY = {
  SMS_GATEWAY_USERNAME: "user",
  SMS_GATEWAY_PASSWORD: "pass",
  SMS_GATEWAY_PASSPHRASE: "a long random passphrase",
};
const TWILIO = {
  TWILIO_ACCOUNT_SID: "AC123",
  TWILIO_AUTH_TOKEN: "token",
  TWILIO_PHONE_NUMBER: "+33700000000",
};
const ALL_KEYS = [
  ...Object.keys(GATEWAY),
  ...Object.keys(TWILIO),
  "SMS_GATEWAY_URL",
];

// Runs sendSms with these secrets and a fake network that answers each host
// with the given status; returns the result and the hosts called, in order.
async function run(
  env: Record<string, string>,
  status: Record<string, number>,
  phone = "06 12 34 56 78",
): Promise<{ sent: boolean; calls: string[]; bodies: string[] }> {
  for (const k of ALL_KEYS) Deno.env.delete(k);
  for (const [k, v] of Object.entries(env)) Deno.env.set(k, v);
  const calls: string[] = [];
  const bodies: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    calls.push(url.host);
    bodies.push(String(init?.body ?? ""));
    return Promise.resolve(
      new Response("{}", { status: status[url.host] ?? 500 }),
    );
  };
  const realError = console.error;
  console.error = () => {};
  try {
    const sent = await sendSms(phone, "Bonjour");
    return { sent, calls, bodies };
  } finally {
    globalThis.fetch = realFetch;
    console.error = realError;
    for (const k of ALL_KEYS) Deno.env.delete(k);
  }
}

const OK = { "api.sms-gate.app": 202, "api.twilio.com": 201 };

Deno.test("the phone sends when the gateway is set up", async () => {
  const r = await run({ ...GATEWAY, ...TWILIO }, OK);
  assertEquals(r.sent, true);
  assertEquals(r.calls, ["api.sms-gate.app"]);
  const body = JSON.parse(r.bodies[0]);
  assertEquals(body.isEncrypted, true);
  assertEquals(r.bodies[0].includes("612345678"), false);
});

Deno.test("never unencrypted: no passphrase means Twilio", async () => {
  const { SMS_GATEWAY_PASSPHRASE: _, ...noPassphrase } = GATEWAY;
  const r = await run({ ...noPassphrase, ...TWILIO }, OK);
  assertEquals(r.sent, true);
  assertEquals(r.calls, ["api.twilio.com"]);
});

Deno.test("Twilio takes over when the gateway refuses", async () => {
  const r = await run(
    { ...GATEWAY, ...TWILIO },
    {
      "api.sms-gate.app": 401,
      "api.twilio.com": 201,
    },
  );
  assertEquals(r.sent, true);
  assertEquals(r.calls, ["api.sms-gate.app", "api.twilio.com"]);
});

Deno.test("no Twilio fallback without its secrets", async () => {
  const r = await run(GATEWAY, { "api.sms-gate.app": 500 });
  assertEquals(r.sent, false);
  assertEquals(r.calls, ["api.sms-gate.app"]);
});

Deno.test("Twilio alone when the gateway isn't set up", async () => {
  const r = await run(TWILIO, OK);
  assertEquals(r.sent, true);
  assertEquals(r.calls, ["api.twilio.com"]);
});

Deno.test("a self-hosted gateway URL is used", async () => {
  const r = await run(
    { ...GATEWAY, SMS_GATEWAY_URL: "https://sms.example.org/3rdparty/v1/" },
    { "sms.example.org": 202 },
  );
  assertEquals(r.sent, true);
  assertEquals(r.calls, ["sms.example.org"]);
});

Deno.test("an invalid number sends nothing", async () => {
  const r = await run({ ...GATEWAY, ...TWILIO }, OK, "12");
  assertEquals(r, { sent: false, calls: [], bodies: [] });
});

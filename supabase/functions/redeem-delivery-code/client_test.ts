// Run: npx -y deno test --node-modules-dir=none supabase/functions/redeem-delivery-code/
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callerIp, clientKey, httpStatus } from "./client.ts";

Deno.test("the first forwarded address is the caller", () => {
  assertEquals(
    callerIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })),
    "203.0.113.7",
  );
  assertEquals(
    callerIp(new Headers({ "x-real-ip": "198.51.100.2" })),
    "198.51.100.2",
  );
  assertEquals(callerIp(new Headers()), "unknown");
});

Deno.test("the key is an HMAC, stable and secret-dependent", async () => {
  const a = await clientKey("203.0.113.7", "secret-1");
  assertEquals(a.length, 64);
  assertEquals(a, await clientKey("203.0.113.7", "secret-1"));
  assertEquals(a === (await clientKey("203.0.113.7", "secret-2")), false);
  // RFC 4231 test case 2.
  assertEquals(
    await clientKey("what do ya want for nothing?", "Jefe"),
    "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
  );
});

Deno.test("statuses map to HTTP codes", () => {
  assertEquals(
    ["ok", "not_found", "invalid", "rate_limited", "?"].map(httpStatus),
    [200, 404, 400, 429, 500],
  );
});

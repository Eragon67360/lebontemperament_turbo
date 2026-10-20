// Run: npx -y deno test --node-modules-dir=none supabase/functions/_shared/sms-gateway_test.ts
import {
  assert,
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { gatewayCipher, gatewayMessage } from "./sms-gateway.ts";

function fromBase64(s: string): Uint8Array {
  return new Uint8Array(Array.from(atob(s), (c) => c.charCodeAt(0)));
}

// What the phone does with an encrypted value (the app's decryption).
async function decrypt(value: string, passphrase: string): Promise<string> {
  const [, algo, iter, salt64, data64] = value.split("$");
  assertEquals(algo, "aes-256-cbc/pbkdf2-sha1");
  const salt = new Uint8Array(fromBase64(salt64));
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-1",
      salt,
      iterations: Number(iter.slice(2)),
    },
    material,
    { name: "AES-CBC", length: 256 },
    false,
    ["decrypt"],
  );
  const plain = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: salt },
    key,
    new Uint8Array(fromBase64(data64)),
  );
  return new TextDecoder().decode(plain);
}

const SMS =
  "Bonjour Marie, votre commande Le Bon Tempérament arrive le sam. 14/11.";

Deno.test("encrypted values use the app's format and decrypt", async () => {
  const encrypt = await gatewayCipher("a long random passphrase");
  const value = await encrypt(SMS);
  assertMatch(
    value,
    /^\$aes-256-cbc\/pbkdf2-sha1\$i=10000\$[A-Za-z0-9+/]{22}==\$[A-Za-z0-9+/=]+$/,
  );
  assertEquals(await decrypt(value, "a long random passphrase"), SMS);
});

Deno.test("a fixed salt gives the same value", async () => {
  const salt = new Uint8Array(16).fill(7);
  const a = await (await gatewayCipher("p", salt, 1000))("+33612345678");
  const b = await (await gatewayCipher("p", salt, 1000))("+33612345678");
  assertEquals(a, b);
  assert(
    a.startsWith("$aes-256-cbc/pbkdf2-sha1$i=1000$BwcHBwcHBwcHBwcHBwcHBw==$"),
  );
});

Deno.test("urgent message with a lifetime", async () => {
  const m = await gatewayMessage(
    "+33612345678",
    SMS,
    { ttlSeconds: 300, urgent: true },
    "secret",
  );
  assertEquals(m.ttl, 300);
  assertEquals(m.priority, 100);
});

Deno.test("no lifetime or priority by default", async () => {
  const m = await gatewayMessage("+33612345678", SMS, {}, "secret");
  assertEquals(Object.keys(m).sort(), [
    "isEncrypted",
    "phoneNumbers",
    "textMessage",
  ]);
});

Deno.test("encrypted message hides the text and the number", async () => {
  const m = await gatewayMessage("+33612345678", SMS, {}, "secret");
  assertEquals(m.isEncrypted, true);
  const text = (m.textMessage as { text: string }).text;
  const [phone] = m.phoneNumbers as string[];
  assert(!text.includes("Marie") && !phone.includes("612345678"));
  assertEquals(await decrypt(text, "secret"), SMS);
  assertEquals(await decrypt(phone, "secret"), "+33612345678");
});

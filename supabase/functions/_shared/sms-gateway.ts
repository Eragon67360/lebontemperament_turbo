// SMS through an Android phone running « SMS Gateway for Android »
// (https://sms-gate.app, open source): the phone sends each SMS with its own
// SIM card and plan, so a round costs nothing. The function hands the message
// to the app's cloud relay, which wakes the phone; the phone then sends it.
//
// Function secrets (Supabase › Edge Functions › Secrets):
//   SMS_GATEWAY_USERNAME, SMS_GATEWAY_PASSWORD  shown in the app (Cloud server)
//   SMS_GATEWAY_PASSPHRASE  the app's encryption passphrase (Settings ›
//     Encryption), a long random one. The text and the number are encrypted
//     before they leave Supabase, so the relay never reads them (the privacy
//     policy says so): without a passphrase the gateway is not used.
//   SMS_GATEWAY_URL  optional, for a self-hosted server
//     (default https://api.sms-gate.app/3rdparty/v1).

const DEFAULT_URL = "https://api.sms-gate.app/3rdparty/v1";

// The passphrase is random and long, so the key-stretching rounds add little
// to it; they cost CPU time on every SMS (about 5 ms at 10 000).
export const PBKDF2_ITERATIONS = 10_000;

export interface GatewayOptions {
  /** Drop the SMS if the phone hasn't sent it after this many seconds. */
  ttlSeconds?: number;
  /** Ask the phone to send it before the others (the « 5 minutes » SMS). */
  urgent?: boolean;
}

/** Whether the gateway secrets, passphrase included, are set. */
export function gatewayConfigured(): boolean {
  return !!(
    Deno.env.get("SMS_GATEWAY_USERNAME") &&
    Deno.env.get("SMS_GATEWAY_PASSWORD") &&
    Deno.env.get("SMS_GATEWAY_PASSPHRASE")
  );
}

function base64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/**
 * The app's passphrase encryption: AES-256-CBC with a PBKDF2-SHA1 key, the
 * 16-byte salt doubling as the IV, written
 * `$aes-256-cbc/pbkdf2-sha1$i=<iterations>$<salt>$<data>` (base64).
 * Returns one encrypt function per salt, so the text and the number of one
 * SMS share a single key derivation.
 */
export async function gatewayCipher(
  passphrase: string,
  salt: Uint8Array = crypto.getRandomValues(new Uint8Array(16)),
  iterations = PBKDF2_ITERATIONS,
): Promise<(value: string) => Promise<string>> {
  // A copy backed by a plain ArrayBuffer, the only kind WebCrypto types take.
  const iv = new Uint8Array(salt);
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-1", salt: iv, iterations },
    material,
    { name: "AES-CBC", length: 256 },
    false,
    ["encrypt"],
  );
  const prefix = `$aes-256-cbc/pbkdf2-sha1$i=${iterations}$${base64(iv)}$`;
  return async (value: string) => {
    const data = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      key,
      new TextEncoder().encode(value),
    );
    return prefix + base64(new Uint8Array(data));
  };
}

/** The JSON body of POST /messages for one recipient, encrypted. */
export async function gatewayMessage(
  to: string,
  body: string,
  options: GatewayOptions,
  passphrase: string,
): Promise<Record<string, unknown>> {
  const encrypt = await gatewayCipher(passphrase);
  const message: Record<string, unknown> = {
    textMessage: { text: await encrypt(body) },
    phoneNumbers: [await encrypt(to)],
    isEncrypted: true,
  };
  if (options.ttlSeconds) message.ttl = options.ttlSeconds;
  if (options.urgent) message.priority = 100;
  return message;
}

/**
 * Hands one SMS to the phone. `to` is already in E.164 form. Returns whether
 * the relay accepted it (the phone sends it as soon as it is reachable).
 * Never throws and never logs the text or the number.
 */
export async function sendGatewaySms(
  to: string,
  body: string,
  options: GatewayOptions = {},
): Promise<boolean> {
  const username = Deno.env.get("SMS_GATEWAY_USERNAME");
  const password = Deno.env.get("SMS_GATEWAY_PASSWORD");
  const passphrase = Deno.env.get("SMS_GATEWAY_PASSPHRASE");
  if (!username || !password || !passphrase) {
    console.error("SMS gateway secrets are not set");
    return false;
  }
  const baseUrl = (Deno.env.get("SMS_GATEWAY_URL") || DEFAULT_URL).replace(
    /\/+$/,
    "",
  );
  try {
    const message = await gatewayMessage(to, body, options, passphrase);
    const res = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${username}:${password}`),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    if (res.ok) return true;
    const err = await res.json().catch(() => ({}));
    console.error(
      "SMS gateway refused the SMS",
      res.status,
      err?.message ?? "",
    );
    return false;
  } catch (e) {
    console.error("SMS gateway failed", e instanceof Error ? e.message : e);
    return false;
  }
}

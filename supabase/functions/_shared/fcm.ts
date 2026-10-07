// Firebase Cloud Messaging (HTTP v1) with the Firebase service account in the
// function secret FIREBASE_SERVICE_ACCOUNT_JSON.
//
// send-push-notification still carries its own copy of getAccessToken (it
// sends to the `all_users` topic and is left as deployed); new functions use
// this module.
import * as jose from "npm:jose@5.2.0";

export interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export function readServiceAccount(): ServiceAccount {
  const json = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!json) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  return JSON.parse(json) as ServiceAccount;
}

export async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const key = await jose.importPKCS8(
    sa.private_key.replace(/\\n/g, "\n"),
    "RS256",
  );
  const jwt = await new jose.SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(Math.floor(Date.now() / 1000))
    .setExpirationTime("1h")
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`OAuth2 token failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface TokenMessage {
  title: string;
  body: string;
  /** Replaces an earlier notification with the same tag on the phone (an
   * alert's « Rétabli » replaces its start). */
  tag: string;
  data: Record<string, string>;
}

export type SendResult = "sent" | "unregistered" | "failed";

/** Sends one notification to one device token. "unregistered" means the
 * token is gone for good (app removed, token rotated) and should be dropped. */
export async function sendToToken(
  sa: ServiceAccount,
  accessToken: string,
  token: string,
  msg: TokenMessage,
): Promise<SendResult> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: msg.title, body: msg.body },
          // "fcm_push" is the channel the app creates at start-up; without it
          // Android files the push under "Miscellaneous", silent.
          android: {
            priority: "high",
            notification: { channel_id: "fcm_push", tag: msg.tag },
          },
          apns: {
            headers: { "apns-collapse-id": msg.tag.slice(0, 64) },
            payload: { aps: { sound: "default" } },
          },
          data: msg.data,
        },
      }),
    },
  );
  if (res.ok) return "sent";

  const text = await res.text();
  // UNREGISTERED (404) or a malformed token (400 INVALID_ARGUMENT naming the
  // token) won't ever work again.
  if (
    res.status === 404 ||
    text.includes("UNREGISTERED") ||
    (res.status === 400 && text.includes("registration token"))
  ) {
    return "unregistered";
  }
  console.error("FCM error:", res.status, text.slice(0, 500));
  return "failed";
}

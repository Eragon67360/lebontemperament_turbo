// Sends one SMS through Twilio with the function secrets TWILIO_ACCOUNT_SID,
// TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER. Used by `sms.ts` when the SMS
// gateway (an Android phone of the association) is not set up or refused
// the message. Never throws: returns whether Twilio accepted the message and
// logs its error otherwise (never the text, which holds the recipient's name
// and code, nor the number).

/** Whether the Twilio secrets are set. */
export function twilioConfigured(): boolean {
  return !!(
    Deno.env.get("TWILIO_ACCOUNT_SID") &&
    Deno.env.get("TWILIO_AUTH_TOKEN") &&
    Deno.env.get("TWILIO_PHONE_NUMBER")
  );
}

/** `to` is already in the E.164 form Twilio takes (« +33612345678 »). */
export async function sendTwilioSms(
  to: string,
  body: string,
): Promise<boolean> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_PHONE_NUMBER");
  if (!accountSid || !authToken || !from) {
    console.error("Twilio secrets are not set");
    return false;
  }
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      },
    );
    if (res.ok) return true;
    const err = await res.json().catch(() => ({}));
    console.error(
      "Twilio SMS failed",
      res.status,
      err?.code ?? "",
      err?.message ?? "",
    );
    return false;
  } catch (e) {
    console.error("Twilio SMS failed", e instanceof Error ? e.message : e);
    return false;
  }
}

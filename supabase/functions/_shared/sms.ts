import { smsPhone } from "./phone.ts";
import {
  type GatewayOptions,
  gatewayConfigured,
  sendGatewaySms,
} from "./sms-gateway.ts";
import { sendTwilioSms, twilioConfigured } from "./twilio.ts";

// Sends one delivery SMS. With the SMS_GATEWAY_* secrets set, the
// association's Android phone sends it (`sms-gateway.ts`, free); Twilio is
// used when the gateway isn't set up, or as a fallback when it refuses the
// message and the TWILIO_* secrets are set (`twilio.ts`, paid per SMS).
// Never throws: returns whether a provider accepted the message.
// The number may be written any French way (« 06 12 34 56 78 »): both
// providers take « +33612345678 », so it is converted here first.
export async function sendSms(
  phone: string,
  body: string,
  options: GatewayOptions = {},
): Promise<boolean> {
  const to = smsPhone(phone);
  if (!to) {
    console.error("SMS not sent: the phone number is not valid");
    return false;
  }
  if (gatewayConfigured()) {
    if (await sendGatewaySms(to, body, options)) return true;
    if (!twilioConfigured()) return false;
    console.error("Sending the SMS through Twilio instead");
  }
  return await sendTwilioSms(to, body);
}

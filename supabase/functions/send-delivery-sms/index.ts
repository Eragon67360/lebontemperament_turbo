import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { recipientId } = await req.json();
    if (!recipientId) {
      return new Response(JSON.stringify({ error: "Missing recipientId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: recipient, error } = await supabaseAdmin
      .from("delivery_recipients")
      .select("phone_number, label, public_token")
      .eq("id", recipientId)
      .single();

    if (error) throw error;
    if (!recipient) throw new Error("Recipient not found.");

    if (!recipient.phone_number || recipient.phone_number.trim() === "") {
      console.log(
        `Recipient ${recipientId} has no phone number. Skipping SMS.`,
      );
      return new Response(
        JSON.stringify({ message: "No phone number for recipient." }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;
    const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
    const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basicAuth = "Basic " + btoa(`${accountSid}:${authToken}`);

    const trackingUrl = `${siteUrl}/track?token=${recipient.public_token}`;
    const messageBody =
      `Bonjour ${recipient.label},\n\n` +
      `Nous avons commencé notre tournée de livraison (fromages et saucissons). Vous êtes le prochain sur notre liste.\n\n` +
      `Suivez en direct : ${trackingUrl}\n\n` +
      `Merci pour votre commande ! Si vous voulez en savoir plus sur nous, n'hésitez pas à visiter notre site : ${siteUrl}.\n\n` +
      `- Félix & Thomas`;

    const requestBody = new URLSearchParams({
      To: recipient.phone_number,
      From: twilioPhoneNumber,
      Body: messageBody,
    });

    const response = await fetch(twilioApiUrl, {
      method: "POST",
      headers: {
        Authorization: basicAuth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Twilio API Error:", errorData);
      throw new Error(`Twilio API request failed: ${errorData.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in send-delivery-sms function:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

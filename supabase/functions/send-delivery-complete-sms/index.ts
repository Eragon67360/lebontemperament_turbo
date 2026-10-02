import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSuperadmin } from "../_shared/caller-auth.ts";

// Contact for incomplete orders, set as a function secret (not in the public repo).
const SUPPORT_PHONE = Deno.env.get("DELIVERY_SUPPORT_PHONE") ?? "";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Only the delivery driver (a superadmin) runs delivery rounds.
    const caller = await requireSuperadmin(req, supabaseAdmin);
    if (caller instanceof Response) return caller;

    const { recipientId } = await req.json();
    if (!recipientId) {
      return new Response(JSON.stringify({ error: "Missing recipientId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: recipient, error } = await supabaseAdmin
      .from("delivery_recipients")
      .select("phone_number, label")
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

    const messageBody =
      `Bonjour ${recipient.label}, votre commande a bien été livrée ! Merci pour votre confiance.\n\n` +
      (SUPPORT_PHONE
        ? `Si la commande devait être incomplète, nous en sommes désolés. N'hésitez pas à écrire à Félix au numéro suivant : ${SUPPORT_PHONE}.\n\n`
        : "") +
      `Si vous voulez en savoir plus sur nous, n'hésitez pas à visiter notre site à cette adresse : ${siteUrl}.\n\n` +
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
    console.error("Error in send-delivery-complete-sms function:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

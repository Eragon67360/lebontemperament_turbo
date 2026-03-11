import { TaxReceiptDocument } from "@/components/donations/TaxReceiptDocument";
import { ASSOCIATION } from "@/lib/donationConstants";
import { numberToFrenchWords } from "@/lib/numberToFrenchWords";
import { createAdminClient } from "@/utils/supabase/admin";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import React from "react";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-02-25.clover",
});

function formatDonorAddress(addr: {
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}): string {
  const parts = [
    addr.line1,
    addr.line2,
    [addr.postal_code, addr.city].filter(Boolean).join(" "),
    addr.state,
    addr.country,
  ].filter(Boolean) as string[];
  return parts.join(", ");
}

function formatPaymentDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function POST(req: NextRequest) {
  console.log("[webhooks/stripe] Webhook received");

  const webhookSecret = process.env.STRIPE_ENDPOINT_SECRET;
  if (!webhookSecret) {
    console.error("[webhooks/stripe] STRIPE_ENDPOINT_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.warn("[webhooks/stripe] Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 },
    );
  }

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhooks/stripe] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  console.log("[webhooks/stripe] Event verified:", event.type, event.id);

  if (event.type !== "checkout.session.completed") {
    console.log("[webhooks/stripe] Ignoring event type:", event.type);
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as import("stripe").Stripe.Checkout.Session;
  const sessionId = session.id;

  // Detailed session payload for local debugging
  console.log("[webhooks/stripe] === Checkout Session (from Stripe) ===");
  console.log("[webhooks/stripe] sessionId:", sessionId);
  console.log("[webhooks/stripe] amount_total (cents):", session.amount_total);
  console.log("[webhooks/stripe] currency:", session.currency);
  console.log("[webhooks/stripe] payment_intent:", session.payment_intent);
  console.log("[webhooks/stripe] payment_status:", session.payment_status);
  console.log(
    "[webhooks/stripe] customer_details:",
    JSON.stringify(session.customer_details, null, 2),
  );
  console.log(
    "[webhooks/stripe] customer_details.address:",
    JSON.stringify(session.customer_details?.address, null, 2),
  );
  console.log("[webhooks/stripe] Full session (keys):", Object.keys(session));
  console.log("[webhooks/stripe] =========================================");

  const supabase = createAdminClient();

  // Idempotency: skip if already processed
  const { data: existing } = await supabase
    .from("donations")
    .select("id")
    .eq("stripe_checkout_session_id", sessionId)
    .single();

  if (existing) {
    console.log(
      "[webhooks/stripe] Idempotency: already processed, skipping",
      sessionId,
    );
    return NextResponse.json({ received: true });
  }

  const customerDetails = session.customer_details;
  const address = customerDetails?.address;

  if (
    !customerDetails?.email ||
    !address?.line1 ||
    !address.postal_code ||
    !address.city
  ) {
    console.error(
      "[webhooks/stripe] Missing required customer details or address:",
      {
        hasEmail: !!customerDetails?.email,
        hasAddress: !!address,
        addressKeys: address ? Object.keys(address) : [],
      },
    );
    return NextResponse.json(
      { error: "Missing required donor details (email, address)" },
      { status: 400 },
    );
  }

  const email = customerDetails.email;
  const nameParts = (customerDetails.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "Prénom";
  const lastName = nameParts.slice(1).join(" ") || "Nom";

  const donorAddress = formatDonorAddress(address);

  console.log("[webhooks/stripe] Extracted donor:", {
    email,
    firstName,
    lastName,
    donorAddress,
  });

  // Upsert donor
  const { data: donor, error: donorError } = await supabase
    .from("donors")
    .upsert(
      {
        email,
        first_name: firstName,
        last_name: lastName,
        address_line1: address.line1,
        address_line2: address.line2 || null,
        postal_code: address.postal_code,
        city: address.city,
        country: address.country || "FR",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    )
    .select("id")
    .single();

  if (donorError || !donor) {
    console.error("[webhooks/stripe] Donor upsert failed:", {
      error: donorError,
      code: donorError?.code,
      message: donorError?.message,
    });
    return NextResponse.json(
      { error: "Failed to save donor" },
      { status: 500 },
    );
  }
  console.log("[webhooks/stripe] Donor saved:", donor.id, email);

  const amountTotal = session.amount_total ?? 0;
  const year = new Date().getFullYear();

  const { data: receiptNumber, error: rpcError } = await supabase.rpc(
    "get_next_receipt_number",
    { p_year: year },
  );

  if (rpcError || typeof receiptNumber !== "string") {
    console.error("[webhooks/stripe] RPC get_next_receipt_number failed:", {
      error: rpcError,
      receiptNumber,
    });
    return NextResponse.json(
      { error: "Failed to generate receipt number" },
      { status: 500 },
    );
  }
  console.log("[webhooks/stripe] Receipt number generated:", receiptNumber);

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const { data: donation, error: donationError } = await supabase
    .from("donations")
    .insert({
      donor_id: donor.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: sessionId,
      amount_cents: amountTotal,
      currency: session.currency ?? "eur",
      receipt_number: receiptNumber,
    })
    .select("id")
    .single();

  if (donationError || !donation) {
    console.error("[webhooks/stripe] Donation insert failed:", {
      error: donationError,
      code: donationError?.code,
      message: donationError?.message,
    });
    return NextResponse.json(
      { error: "Failed to save donation" },
      { status: 500 },
    );
  }
  console.log("[webhooks/stripe] Donation saved:", donation.id);

  const amountLetters = numberToFrenchWords(amountTotal);
  const paymentDate = formatPaymentDate(new Date());
  const donorName = `${firstName} ${lastName}`.trim();

  const receiptProps = {
    associationName: ASSOCIATION.name,
    associationAddress: ASSOCIATION.address,
    donorName,
    donorAddress,
    amountEur: amountTotal / 100,
    amountLetters,
    paymentDate,
    receiptNumber,
  };

  let pdfBuffer: Buffer;
  try {
    // TaxReceiptDocument returns <Document>...</Document> - cast for @react-pdf type compatibility
    pdfBuffer = await renderToBuffer(
      React.createElement(TaxReceiptDocument, receiptProps) as Parameters<
        typeof renderToBuffer
      >[0],
    );
  } catch (pdfErr) {
    console.error(
      "[webhooks/stripe] PDF generation failed:",
      pdfErr instanceof Error ? pdfErr.message : pdfErr,
    );
    return NextResponse.json(
      { error: "Failed to generate tax receipt PDF" },
      { status: 500 },
    );
  }
  console.log(
    "[webhooks/stripe] PDF generated, size:",
    pdfBuffer.length,
    "bytes",
  );

  const storagePath = `${year}/${receiptNumber}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("donation-receipts")
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error(
      "[webhooks/stripe] Storage upload failed:",
      uploadError.message,
      uploadError,
    );
    return NextResponse.json(
      { error: "Failed to upload PDF to storage" },
      { status: 500 },
    );
  }
  console.log("[webhooks/stripe] PDF uploaded to storage:", storagePath);

  await supabase
    .from("donations")
    .update({ pdf_storage_path: storagePath })
    .eq("id", donation.id);

  const username = process.env.NEXT_PUBLIC_BURNER_USERNAME;
  const password = process.env.NEXT_PUBLIC_BURNER_PASSWORD;

  if (username && password) {
    try {
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: username, pass: password },
      });

      await transporter.sendMail({
        from: username,
        to: email,
        subject: "Votre reçu fiscal - Le Bon Tempérament",
        html: `
          <p>Bonjour ${donorName},</p>
          <p>Nous vous remercions chaleureusement pour votre don à l'association Le Bon Tempérament.</p>
          <p>Veuillez trouver ci-joint votre reçu fiscal, valable pour votre déclaration d'impôts (Article 200 CGI).</p>
          <p>Merci de votre générosité !</p>
          <p>L'équipe du Bon Tempérament</p>
        `,
        attachments: [
          {
            filename: `recu-fiscal-${receiptNumber}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      await supabase
        .from("donations")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", donation.id);
      console.log("[webhooks/stripe] Email sent to:", email);
    } catch (emailErr) {
      console.error(
        "[webhooks/stripe] Email send failed:",
        emailErr instanceof Error ? emailErr.message : emailErr,
      );
      // Don't fail the webhook - receipt is stored, can be re-sent manually
    }
  } else {
    console.warn("[webhooks/stripe] Email not configured, skipping send");
  }

  console.log("[webhooks/stripe] Processing complete for session:", sessionId);
  return NextResponse.json({ received: true });
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const { amountCents } = await req.json();

    if (typeof amountCents !== "number" || amountCents < 100) {
      return NextResponse.json(
        { error: "Montant minimum : 1€ (100 centimes)" },
        { status: 400 },
      );
    }

    const origin = req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Don à l'association Le Bon Tempérament",
              description:
                "Don ouvrant droit à réduction d'impôt (Article 200 CGI)",
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      billing_address_collection: "required",
      success_url: `${origin}/don?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/don`,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("[donations/create-checkout-session]", err);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 },
    );
  }
}

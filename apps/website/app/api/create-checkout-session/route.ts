import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    const session = await stripe?.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map(
        (item: {
          name: string;
          image: unknown;
          price: number;
          quantity: number;
        }) => ({
          price_data: {
            currency: "eur",
            product_data: {
              name: item.name,
              images: [item.image],
            },
            unit_amount: item.price * 100,
          },
          quantity: item.quantity,
        })
      ),
      mode: "payment",
      success_url: `${req.nextUrl.origin}/success`,
      cancel_url: `${req.nextUrl.origin}/cancel`,
    });

    return NextResponse.json({ id: session.id });
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}

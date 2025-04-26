import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-03-31.basil",
});

export async function GET() {
  try {
    const products = await stripe.products.list({
      expand: ["data.default_price"],
    });

    const formattedProducts = products.data.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.images[0],
      price: (product.default_price as Stripe.Price).unit_amount,
      currency: (product.default_price as Stripe.Price).currency,
      slug: product.metadata.slug,
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}

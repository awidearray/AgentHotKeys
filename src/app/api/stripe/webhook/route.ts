import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
// import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: NextRequest) {
  // In production on Cloudflare, use getCloudflareContext() for env bindings:
  // const { env } = await getCloudflareContext();
  // const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  // const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Generate a download token and store in KV
    // In production on Cloudflare:
    // const kv = env.PURCHASE_TOKENS as KVNamespace;
    // const token = crypto.randomUUID();
    // await kv.put(token, JSON.stringify({
    //   sessionId: session.id,
    //   email: session.customer_details?.email,
    //   createdAt: Date.now(),
    // }), { expirationTtl: 3600 });

    console.log("Payment completed:", session.id, session.customer_details?.email);
  }

  return NextResponse.json({ received: true });
}

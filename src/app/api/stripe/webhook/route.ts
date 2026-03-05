import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error("Stripe webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
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
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;

    console.log(
      "Payment completed — session:",
      session.id,
      "email:",
      email,
      "amount:",
      session.amount_total
    );

    // When Cloudflare KV is set up, generate download tokens here:
    // const { env } = await getCloudflareContext();
    // const kv = env.PURCHASE_TOKENS as KVNamespace;
    // const token = crypto.randomUUID();
    // await kv.put(token, JSON.stringify({
    //   sessionId: session.id,
    //   email,
    //   createdAt: Date.now(),
    // }), { expirationTtl: 3600 });
    //
    // Then send email with download link via Brevo:
    // await sendDownloadEmail(email, token);
  }

  return NextResponse.json({ received: true });
}

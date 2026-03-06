import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { fireBrevoEvent } from "@/lib/brevo";

async function addPurchaserToList(email: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const listIdRaw = process.env.BREVO_PURCHASERS_LIST_ID;
  if (!apiKey || apiKey.startsWith("xkeysib-REPLACE") || !listIdRaw) return;
  const listId = parseInt(listIdRaw, 10);
  if (!listId) return;
  try {
    // Create/update contact and add to purchasers list
    const createRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        updateEnabled: true,
        listIds: [listId],
      }),
    });
    if (createRes.ok) return;
    if (createRes.status === 409) {
      // Contact exists — add to list
      const addRes = await fetch(
        `https://api.brevo.com/v3/contacts/lists/${listId}/contacts/add`,
        {
          method: "POST",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ emails: [email] }),
        }
      );
      if (!addRes.ok) console.warn("Brevo add to purchasers list:", addRes.status);
    }
  } catch {
    // non-fatal
  }
}

async function sendDownloadEmail(email: string, sessionId: string) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey || brevoApiKey.startsWith("xkeysib-REPLACE")) {
    console.log("Brevo not configured — skipping email to", email);
    return;
  }

  const siteUrl = process.env.SITE_URL || "https://hotkeys.ai";
  const downloadUrl = `${siteUrl}/success?session_id=${sessionId}`;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "HotKeys.ai",
          email: "logan@hotkeys.ai",
        },
        to: [{ email }],
        subject: "Your HotKeys — Download Ready",
        htmlContent: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <h1 style="font-size: 24px; margin-bottom: 16px;">You're in. Welcome to the team.</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              Your Agentic Command Keys guide is ready. Click the button below to download your 17-page PDF.
            </p>
            <div style="margin: 32px 0;">
              <a href="${downloadUrl}"
                 style="display: inline-block; background: #00E5A0; color: #06060B; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; text-decoration: none;">
                Download Your PDF
              </a>
            </div>
            <p style="font-size: 14px; color: #999; line-height: 1.6;">
              This download link is tied to your purchase and can be used anytime.<br/>
              If you have any issues, reply to this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="font-size: 12px; color: #999;">
              &copy; 2026 Logan Golema / AlphaTON Capital
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error("Brevo email failed:", res.status, await res.text());
    } else {
      console.log("Download email sent to", email);
    }
  } catch (err) {
    console.error("Brevo email error:", err);
  }
}

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

    if (email) {
      await sendDownloadEmail(email, session.id);
      await fireBrevoEvent(email, "purchase_completed", {
        product: "hotkeys_guide",
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? "usd",
      });
      await addPurchaserToList(email);
    }
  }

  return NextResponse.json({ received: true });
}

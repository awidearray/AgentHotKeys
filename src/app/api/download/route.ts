import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { fireBrevoEvent } from "@/lib/brevo";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  // Always verify payment with Stripe — no backdoors
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not verified" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 403 });
  }

  // Serve the PDF
  // On Cloudflare Workers, use R2:
  // const { env } = await getCloudflareContext();
  // const object = await env.PDF_BUCKET.get("Agentic_Command_Keys.pdf");
  // return new NextResponse(object.body, { headers: pdfHeaders });

  // On Node.js (local dev / Vercel / etc), read from filesystem
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  try {
    const email = session.customer_details?.email;
    if (email) {
      fireBrevoEvent(email, "download_accessed").catch(() => {});
    }
    const pdfPath = join(process.cwd(), "private", "Agentic_Command_Keys.pdf");
    const pdf = await readFile(pdfPath);
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Agentic_Command_Keys.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
// import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  // Verify the payment with Stripe
  const stripe = new Stripe(stripeSecretKey);
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not verified" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 403 });
  }

  // In production on Cloudflare, serve from R2:
  // const { env } = await getCloudflareContext();
  // const bucket = env.PDF_BUCKET as R2Bucket;
  // const object = await bucket.get("Agentic_Command_Keys.pdf");
  // if (!object) {
  //   return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  // }
  // return new NextResponse(object.body as ReadableStream, {
  //   headers: {
  //     "Content-Type": "application/pdf",
  //     "Content-Disposition": 'attachment; filename="Agentic_Command_Keys.pdf"',
  //     "Cache-Control": "no-store",
  //   },
  // });

  // For local dev, read from filesystem
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  try {
    const pdfPath = join(process.cwd(), "_backup", "Agentic_Command_Keys.pdf");
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

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SuccessContent from "./SuccessContent";

export const metadata: Metadata = {
  title: "Purchase Complete",
  robots: { index: false, follow: false },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/");
  }

  // Server-side payment verification — always verify, no backdoors
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    // Stripe not configured — can't verify, redirect home
    redirect("/");
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeSecretKey);
  let verified = false;
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === "paid") {
      // Shared Stripe account: a paid session from another product must not
      // unlock this one. Same exit as unpaid — no hint why.
      const { isHotkeysSession } = await import("@/lib/stripe-ownership");
      verified = await isHotkeysSession(session, stripe);
    }
  } catch {
    verified = false;
  }
  if (!verified) {
    redirect("/");
  }

  return <SuccessContent sessionId={session_id} />;
}

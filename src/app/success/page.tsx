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

  // Server-side payment verification
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecretKey && !stripeSecretKey.startsWith("sk_test_REPLACE")) {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey);
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status !== "paid") {
        redirect("/");
      }
    } catch {
      redirect("/");
    }
  }

  return <SuccessContent sessionId={session_id} />;
}

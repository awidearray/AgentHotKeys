import type Stripe from "stripe";

export const HOTKEYS_PRODUCT = "hotkeys_guide";

// The Stripe account is shared with unrelated products, and Stripe delivers
// every subscribed event type to every webhook endpoint on the account — so
// checkout.session.completed fires here for other products' sales too.
// Sessions created by our own checkout carry metadata.product; sessions
// created before that marker shipped are recognized by their single ad-hoc
// line item. Anything unverifiable is treated as not ours.
export async function isHotkeysSession(
  session: Stripe.Checkout.Session,
  stripe: Stripe
): Promise<boolean> {
  if (session.metadata?.product === HOTKEYS_PRODUCT) return true;
  if (session.mode !== "payment") return false;
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 10,
    });
    return items.data.some(
      (item) => item.description === "Agentic Command Keys"
    );
  } catch {
    return false;
  }
}

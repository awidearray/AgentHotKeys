import type Stripe from "stripe";
import { isHotkeysSession } from "./stripe-ownership";

const asSession = (s: Record<string, unknown>) =>
  s as unknown as Stripe.Checkout.Session;

const stripeWith = (
  listLineItems: jest.Mock
): { stripe: Stripe; listLineItems: jest.Mock } => ({
  stripe: {
    checkout: { sessions: { listLineItems } },
  } as unknown as Stripe,
  listLineItems,
});

describe("isHotkeysSession", () => {
  it("accepts a session carrying our metadata marker without an API call", async () => {
    const { stripe, listLineItems } = stripeWith(jest.fn());
    const owned = asSession({
      id: "cs_1",
      mode: "payment",
      metadata: { product: "hotkeys_guide" },
    });
    await expect(isHotkeysSession(owned, stripe)).resolves.toBe(true);
    expect(listLineItems).not.toHaveBeenCalled();
  });

  it("rejects a foreign payment session whose line items are not ours", async () => {
    const { stripe } = stripeWith(
      jest.fn().mockResolvedValue({
        data: [{ description: "Reading Journey — Month 1" }],
      })
    );
    const foreign = asSession({
      id: "cs_2",
      mode: "payment",
      metadata: { product: "advisor_pro" },
    });
    await expect(isHotkeysSession(foreign, stripe)).resolves.toBe(false);
  });

  it("accepts a legacy marker-less session by its line item", async () => {
    const { stripe } = stripeWith(
      jest.fn().mockResolvedValue({
        data: [{ description: "Agentic Command Keys" }],
      })
    );
    const legacy = asSession({ id: "cs_3", mode: "payment", metadata: {} });
    await expect(isHotkeysSession(legacy, stripe)).resolves.toBe(true);
  });

  it("rejects subscription-mode sessions outright", async () => {
    const { stripe, listLineItems } = stripeWith(jest.fn());
    const sub = asSession({ id: "cs_4", mode: "subscription", metadata: {} });
    await expect(isHotkeysSession(sub, stripe)).resolves.toBe(false);
    expect(listLineItems).not.toHaveBeenCalled();
  });

  it("fails closed when line items cannot be fetched", async () => {
    const { stripe } = stripeWith(
      jest.fn().mockRejectedValue(new Error("stripe down"))
    );
    const unknown = asSession({ id: "cs_5", mode: "payment", metadata: {} });
    await expect(isHotkeysSession(unknown, stripe)).resolves.toBe(false);
  });
});

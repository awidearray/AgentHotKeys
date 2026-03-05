"use client";

import SectionHeader from "@/components/ui/SectionHeader";
import { pricingFeatures } from "@/data/commands";

const STRIPE_LINK =
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ||
  "https://buy.stripe.com/00wcN51Qx0iV1aSeva57W01";

export default function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-[1100px] mx-auto px-6 relative z-1">
        <SectionHeader
          title="Get the Complete System"
          subtitle="Everything you need to command AI like a senior engineer."
        />

        <div className="max-w-[520px] mx-auto bg-bg-card border-2 border-accent rounded-2xl p-12 text-center relative overflow-hidden">
          <div className="radial-glow absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[400px]" />

          <h3 className="text-[28px] font-extrabold mb-2 relative z-1">
            Agentic Command Keys
          </h3>
          <p className="text-text-dim mb-8 relative z-1">
            The complete 17-page PDF guide
          </p>

          <div className="text-6xl font-black gradient-text mb-2 relative z-1">
            <span className="text-2xl">$</span>35
          </div>
          <p className="text-text-dim text-sm mb-8 relative z-1">
            One-time purchase. Instant download. Lifetime updates.
          </p>

          <ul className="text-left mb-9 relative z-1">
            {pricingFeatures.map((feature, i) => (
              <li
                key={i}
                className="py-2.5 border-b border-border text-text-dim text-[15px] flex items-center gap-3"
              >
                <span className="text-accent font-bold text-base">
                  &#10003;
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              window.location.href = STRIPE_LINK;
            }}
            className="relative z-1 w-full py-4.5 rounded-xl bg-accent text-bg font-extrabold text-lg border-none cursor-pointer transition-all duration-300 hover:bg-accent-bright hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,229,160,0.15)]"
          >
            Buy Now &mdash; $35
          </button>

          <p className="text-text-dim text-xs mt-4 relative z-1">
            Secure payment via Stripe. Instant PDF download after purchase.
          </p>
        </div>
      </div>
    </section>
  );
}

import FadeUp from "@/components/ui/FadeUp";
import { proofStats } from "@/data/commands";

export default function SocialProof() {
  return (
    <section className="py-20">
      <div className="max-w-[1100px] mx-auto px-6 relative z-1">
        <FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {proofStats.map((stat, i) => (
              <div
                key={i}
                className="bg-bg-card border border-border rounded-xl p-8 text-center"
              >
                <div className="text-5xl font-black gradient-text">
                  {stat.number}
                </div>
                <div className="text-text-dim text-sm mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

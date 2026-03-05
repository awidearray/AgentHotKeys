import type { Metadata } from "next";
import { commands } from "@/data/commands";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeUp from "@/components/ui/FadeUp";

export const metadata: Metadata = {
  title: "Free Preview — 3 Command Keys",
  description:
    "Try 3 of the 13 Agentic Command Keys for free. See how they enforce real engineering discipline on AI agents.",
};

const previewKeys = [
  commands.find((c) => c.key === "C-1")!,
  commands.find((c) => c.key === "C-6")!,
  commands.find((c) => c.key === "C-4")!,
];

export default function PreviewPage() {
  return (
    <main className="pt-28 pb-24">
      <div className="max-w-[1100px] mx-auto px-6 relative z-1">
        <SectionHeader
          title="Free Preview"
          subtitle="Try 3 of the 13 command keys. See what disciplined AI engineering looks like."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {previewKeys.map((cmd, i) => (
            <FadeUp key={cmd.key} delay={i * 100}>
              <Card>
                <span className="font-mono inline-block bg-accent/10 border border-accent/30 text-accent px-3 py-1 rounded-md text-[13px] font-semibold mb-3">
                  {cmd.key}
                </span>
                <h3 className="text-lg font-bold mb-1.5 text-text-primary">
                  {cmd.title}
                </h3>
                <div className="text-accent text-[13px] mb-3">
                  {cmd.subtitle}
                </div>
                <p className="text-text-dim text-sm leading-relaxed">
                  {cmd.description}
                </p>
              </Card>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold mb-4">
              Want all 13 command keys?
            </h2>
            <p className="text-text-dim text-lg mb-8 max-w-md mx-auto">
              Get the complete system — 13 production-tested keys, workflow
              templates, and setup guides for every major editor.
            </p>
            <Button variant="primary" href="/#pricing">
              Get the Complete System — $35
            </Button>
          </div>
        </FadeUp>
      </div>
    </main>
  );
}

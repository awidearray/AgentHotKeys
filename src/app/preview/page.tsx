import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeUp from "@/components/ui/FadeUp";

export const metadata: Metadata = {
  title: "Preview — Agentic Command Keys",
  description:
    "See how 13 command keys enforce real engineering discipline on AI agents. Stop the stubs, the mocks, and the theater.",
};

const teasers = [
  {
    label: "Before",
    text: "AI writes a test file with describe blocks, it blocks, and assertions that check... nothing. Green checkmarks everywhere. Zero real coverage.",
    dim: true,
  },
  {
    label: "After",
    text: "One command key forces boundary conditions, error paths, async behavior, and integration points. Tests that fail when code breaks.",
    dim: false,
  },
  {
    label: "Before",
    text: 'AI delivers a "complete" feature with // TODO: implement scattered through the service layer. Looks finished in the PR. Breaks in production.',
    dim: true,
  },
  {
    label: "After",
    text: "One command key catches every stub, every placeholder, every swallowed error. Nothing ships until it's real.",
    dim: false,
  },
  {
    label: "Before",
    text: "AI commits 47 files with the message \"update code\". No one knows what changed or why. Git blame is useless.",
    dim: true,
  },
  {
    label: "After",
    text: "One command key enforces atomic commits, accurate messages, and self-review before push. Every commit tells a story.",
    dim: false,
  },
];

export default function PreviewPage() {
  return (
    <main className="pt-28 pb-24">
      <div className="max-w-[800px] mx-auto px-6 relative z-1">
        <SectionHeader
          title="What Changes"
          subtitle="The difference between AI that performs and AI that delivers."
        />

        <div className="space-y-6 mb-20">
          {teasers.map((t, i) => (
            <FadeUp key={i} delay={i * 80}>
              <div
                className={`border-l-2 pl-6 md:pl-8 ${
                  t.dim
                    ? "border-border"
                    : "border-accent"
                }`}
              >
                <span
                  className={`font-mono text-xs font-semibold tracking-wide uppercase block mb-2 ${
                    t.dim ? "text-text-dim" : "text-accent"
                  }`}
                >
                  {t.label}
                </span>
                <p
                  className={`text-base md:text-lg leading-relaxed ${
                    t.dim ? "text-text-dim" : "text-text-primary font-medium"
                  }`}
                >
                  {t.text}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold mb-4">
              13 keys. Every failure mode covered.
            </h2>
            <p className="text-text-dim text-lg mb-8 max-w-md mx-auto">
              The complete system — production-tested prompts, workflow
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

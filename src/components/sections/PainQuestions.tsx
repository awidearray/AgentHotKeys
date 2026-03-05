import FadeUp from "@/components/ui/FadeUp";
import Button from "@/components/ui/Button";

const questions = [
  "When your AI writes a test\u2026 does it actually test anything?",
  "When your AI \u2018handles errors\u2019\u2026 does it just swallow them into silence?",
  "When your AI says \u2018implementation here\u2019\u2026 is that a TODO or a lie?",
  "When your AI refactors\u2026 does it actually run the code after?",
  "When your AI finishes a feature\u2026 would you deploy it without looking?",
  "When your AI commits\u2026 does the message match what actually changed?",
  "When your AI says it\u2019s done\u2026 is it?",
];

export default function PainQuestions() {
  return (
    <section id="questions" className="py-24">
      <div className="max-w-[800px] mx-auto px-6 relative z-1">
        <FadeUp>
          <span className="font-mono text-accent text-[13px] font-semibold tracking-[2px] uppercase mb-16 block text-center">
            Be Honest
          </span>
        </FadeUp>

        <div className="space-y-10">
          {questions.map((q, i) => (
            <FadeUp key={i} delay={i * 120}>
              <div className="border-l-2 border-accent/40 pl-6 md:pl-8">
                <span className="font-mono text-accent/60 text-xs block mb-2">
                  [C-?]
                </span>
                <p className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-snug text-text-primary">
                  {q}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={questions.length * 120 + 200}>
          <div className="mt-20 text-center">
            <p className="text-lg md:text-xl text-text-dim leading-relaxed mb-8 max-w-[600px] mx-auto">
              You already know the answers.
              <br />
              <span className="text-text-primary font-bold">
                The question is whether you have a system to enforce them.
              </span>
            </p>
            <Button variant="primary" href="#pricing">
              Get the System
              <span className="text-[13px] opacity-80">&mdash; $35</span>
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

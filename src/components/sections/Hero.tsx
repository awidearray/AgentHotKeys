import Badge from "@/components/ui/Badge";
import GradientText from "@/components/ui/GradientText";
import Button from "@/components/ui/Button";
import { commandKeys } from "@/data/commands";

export default function Hero() {
  return (
    <section className="pt-28 md:pt-40 pb-16 md:pb-24 relative">
      <div className="radial-glow absolute top-20 left-1/2 -translate-x-1/2" />

      <div className="max-w-[1100px] mx-auto px-6 relative z-1">
        <Badge variant="hero" className="mb-6">
          From the CTO of a Publicly Traded Company
        </Badge>

        <h1 className="text-4xl md:text-[clamp(48px,6vw,72px)] font-black leading-[1.05] mb-6 tracking-tight">
          Stop Watching
          <br className="md:hidden" />{" "}
          AI
          <br />
          <GradientText>Pretend to Code.</GradientText>
        </h1>

        <p className="text-xl text-text-dim max-w-[560px] leading-relaxed mb-10">
          13 keyboard shortcuts that enforce real engineering discipline on AI
          agents. No stubs. No placeholders. No theater. Just production-grade
          code.
        </p>

        <div className="flex gap-4 flex-wrap mb-15">
          <Button variant="primary" href="#pricing">
            Get the Command Keys
            <span className="text-[13px] opacity-80">&mdash; $35</span>
          </Button>
          <Button variant="secondary" href="#questions">
            See If This Is You
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {commandKeys.map((key) => (
            <Badge key={key} variant="key">
              {key}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}

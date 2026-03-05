import FadeUp from "@/components/ui/FadeUp";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import { commands } from "@/data/commands";

export default function Commands() {
  return (
    <section id="commands" className="py-24">
      <div className="max-w-[1100px] mx-auto px-6 relative z-1">
        <SectionHeader
          title="Your Command Arsenal"
          subtitle="Each key targets a specific AI failure mode. Together, they cover the entire development lifecycle."
        />

        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {commands.map((cmd, i) => (
            <FadeUp key={cmd.key} delay={i * 50}>
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
      </div>
    </section>
  );
}

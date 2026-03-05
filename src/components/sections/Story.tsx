import FadeUp from "@/components/ui/FadeUp";
import { timelineItems } from "@/data/commands";

export default function Story() {
  return (
    <section id="story" className="py-28">
      <div className="max-w-[1100px] mx-auto px-6 relative z-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          {/* Left column */}
          <FadeUp>
            <span className="font-mono text-accent text-[13px] font-semibold tracking-[2px] uppercase mb-4 block">
              The Origin Story
            </span>

            <h2 className="text-4xl font-extrabold leading-tight mb-6 tracking-tight">
              From Writing Every Line
              <br />
              to Commanding AI That Does
            </h2>

            <div className="text-text-dim text-base leading-relaxed space-y-5">
              <p>
                I&apos;m{" "}
                <a
                  href="https://logangolema.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-primary font-bold hover:text-accent transition-colors"
                >
                  Logan Golema
                </a>
                , CTO at{" "}
                <strong className="text-text-primary">AlphaTON Capital</strong>{" "}
                &mdash; a publicly traded company where shipping broken code
                isn&apos;t an option. The stakes are real. The deadlines are
                yesterday.
              </p>
              <p>
                When AI coding tools exploded, I was excited. Then I was furious.
                I watched Claude, GPT, and Copilot produce beautiful-looking
                code that{" "}
                <strong className="text-text-primary">
                  didn&apos;t actually work
                </strong>
                . Stubbed functions. Mocked tests that tested nothing. Error
                handling that swallowed every exception into silence.
              </p>
              <p>
                It looked like engineering. It was{" "}
                <strong className="text-text-primary">theater</strong>.
              </p>
              <p>
                So I built a system. 13 command keys that force AI agents to
                behave like the senior engineers I&apos;d actually hire. No
                shortcuts. No pretending. Every key targets a specific failure
                mode I&apos;ve caught AI doing thousands of times.
              </p>
              <p>
                Now my team ships production code 10x faster &mdash; and it{" "}
                <strong className="text-text-primary">actually works</strong>.
              </p>
            </div>
          </FadeUp>

          {/* Right column - Timeline */}
          <FadeUp delay={200}>
            <div className="flex flex-col border-l-2 border-border pl-8 ml-5">
              {timelineItems.map((item, i) => (
                <div key={i} className="relative pb-9">
                  <div
                    className={`absolute -left-[41px] top-1 w-4 h-4 rounded-full border-2 border-accent ${
                      item.active ? "bg-accent" : "bg-bg"
                    }`}
                  />
                  <div className="font-mono text-accent text-sm font-semibold mb-1">
                    {item.year}
                  </div>
                  <div className="text-text-dim text-sm">{item.desc}</div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

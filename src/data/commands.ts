export interface Command {
  key: string;
  title: string;
  subtitle: string;
  description: string;
}

export const commands: Command[] = [
  {
    key: "C-1",
    title: "Plan & Research",
    subtitle: "Analyze before you build",
    description:
      "Forces AI to clarify goals, map dependencies, research patterns, and outline architecture before writing a single line.",
  },
  {
    key: "C-2",
    title: "Implement Plan",
    subtitle: "Execute with zero shortcuts",
    description:
      "Real functional code only. No stubs, no TODOs, no placeholders. Stops and discusses if it hits blockers.",
  },
  {
    key: "C-3",
    title: "Keep Going",
    subtitle: "Autonomous completion",
    description:
      "AI works through every remaining task without stopping to ask permission. Full complexity, no simplification.",
  },
  {
    key: "C-4",
    title: "Code Quality Pass",
    subtitle: "The 4C Framework",
    description:
      "Compact, Concise, Clean, Capable. Removes dead code, simplifies logic, fixes naming, handles edge cases.",
  },
  {
    key: "C-5",
    title: "Thorough Testing",
    subtitle: "Beyond the happy path",
    description:
      "Boundary conditions, error handling, integration points, async behavior. Real code paths, not mocked away.",
  },
  {
    key: "C-6",
    title: "LARP Assessment",
    subtitle: "Is this code real or theater?",
    description:
      "The most important key. Catches stubbed functions, fake data, swallowed errors, and validation that doesn't validate.",
  },
  {
    key: "C-7",
    title: "Workflow Assessment",
    subtitle: "Audit your dev process",
    description:
      "Catches hollow milestone commits, missing test coverage, broken CI, and documentation that doesn't match code.",
  },
  {
    key: "C-8",
    title: "Production Readiness",
    subtitle: "Final deployment gate",
    description:
      "Evidence-based verification: tests pass for real, config externalized, deps pinned, rollback tested, monitoring live.",
  },
  {
    key: "C-9",
    title: "Review Last Task",
    subtitle: "Honest retrospective",
    description:
      "Did it actually work? Was anything skipped? What could break in production? Assessment, not a victory lap.",
  },
  {
    key: "C-0",
    title: "Commit Workflow",
    subtitle: "Clean atomic commits",
    description:
      "Accurate messages, single-concern commits, conventional format, issue references, self-review before push.",
  },
  {
    key: "C-10",
    title: "Branch-to-Main",
    subtitle: "Full lifecycle management",
    description:
      "Feature branch → atomic commits → PR → CI → review → squash merge → tag → cleanup. No steps skipped.",
  },
  {
    key: "C-11",
    title: "Quick Ship",
    subtitle: "Fast lane to main",
    description:
      "One command: commit, branch, PR, tests, squash merge. The fastest path when quality is already proven.",
  },
  {
    key: "C-12",
    title: "Verify & Merge",
    subtitle: "Prove it works, then merge",
    description:
      "Rebase on main, run full test suite, manually verify flows, check logs, validate config. Merge only after evidence proves it's ready.",
  },
];

export const commandKeys = [
  "C-1", "C-2", "C-3", "C-4", "C-5", "C-6",
  "C-7", "C-8", "C-9", "C-0", "C-10", "C-11", "C-12",
];

export const pricingFeatures = [
  "13 production-tested command key prompts",
  "Step-by-step keybinding setup guide",
  "VS Code, Cursor, Claude Code instructions",
  "5 recommended workflow templates",
  "Pro tips for each command key",
  "Works with Claude, GPT, Copilot, and any AI agent",
];

export const proofStats = [
  { number: "13", label: "Command keys covering the full dev lifecycle" },
  { number: "10x", label: "Faster shipping with code that actually works" },
  { number: "0", label: "Tolerance for stubs, mocks, or AI theater" },
];

export const timelineItems = [
  {
    year: "The Early Days",
    desc: "Full-stack developer. Wrote everything by hand. Knew every line.",
    active: false,
  },
  {
    year: "The AI Wave",
    desc: "Started using AI coding tools. Productivity soared — then bugs exploded.",
    active: false,
  },
  {
    year: "The Breaking Point",
    desc: "Discovered AI was LARPing — writing code that looked right but wasn't. Tests that tested nothing.",
    active: false,
  },
  {
    year: "The System",
    desc: "Built the Command Keys framework. 11 hotkeys that enforce real engineering on AI agents.",
    active: false,
  },
  {
    year: "Today — CTO, AlphaTON Capital",
    desc: "Leading agentic development at a publicly traded company. Shipping real code, fast.",
    active: true,
  },
];

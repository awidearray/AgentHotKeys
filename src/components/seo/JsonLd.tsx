export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: "HotKeys.ai — 13 AI Coding Command Keys",
        description:
          "13 keyboard shortcuts that enforce real engineering discipline on AI coding agents. A 17-page PDF guide for VS Code, Cursor, and Claude Code.",
        offers: {
          "@type": "Offer",
          price: "35.00",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://hotkeys.ai/#pricing",
        },
        brand: {
          "@type": "Organization",
          name: "HotKeys.ai",
          url: "https://hotkeys.ai",
        },
        creator: {
          "@type": "Person",
          name: "Logan Golema",
          jobTitle: "CTO",
          url: "https://logangolema.com",
          sameAs: ["https://logangolema.com"],
          worksFor: {
            "@type": "Organization",
            name: "AlphaTON Capital",
            url: "https://AlphaTONCapital.com",
          },
        },
      },
      {
        "@type": "Organization",
        name: "HotKeys.ai",
        url: "https://hotkeys.ai",
        description:
          "AI coding hotkeys and command keys that enforce engineering discipline on AI agents.",
        founder: {
          "@type": "Person",
          name: "Logan Golema",
        },
      },
      {
        "@type": "WebPage",
        name: "AI Coding Hotkeys — 13 Command Keys for AI Agents | HotKeys.ai",
        description:
          "13 keyboard shortcuts that force AI agents to write production-grade code. Works with Claude, Cursor, Copilot, and GPT.",
        url: "https://hotkeys.ai",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "When your AI writes a test, does it actually test anything?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Most AI agents write tests with empty assertions or mocked-away logic. HotKeys.ai command keys force AI to write tests that cover boundary conditions, error paths, async behavior, and integration points.",
            },
          },
          {
            "@type": "Question",
            name: "How do I stop AI from writing stub code and placeholders?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "HotKeys.ai provides 13 keyboard shortcuts that enforce real engineering discipline. Each key targets a specific AI failure mode — stubs, fake error handling, untested refactors, and more.",
            },
          },
          {
            "@type": "Question",
            name: "What AI coding tools do these hotkeys work with?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The command keys work with Claude, Cursor, GPT, Copilot, and any AI coding agent. Setup guides are included for VS Code, Cursor, and Claude Code.",
            },
          },
          {
            "@type": "Question",
            name: "What do I get when I buy HotKeys.ai?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A 17-page PDF guide with 13 production-tested command key prompts, step-by-step keybinding setup instructions, 5 workflow templates, and pro tips for each key. One-time $35 purchase with lifetime updates.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

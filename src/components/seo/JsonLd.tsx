export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: "HotKeys.ai — Agentic Command Keys",
        description:
          "13 keyboard shortcuts that enforce real engineering discipline on AI agents. A 17-page PDF guide.",
        offers: {
          "@type": "Offer",
          price: "35.00",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://hotkeys.ai/#pricing",
        },
        brand: {
          "@type": "Organization",
          name: "AlphaTON Capital",
          url: "https://AlphaTONCapital.com",
        },
        creator: {
          "@type": "Person",
          name: "Logan Golema",
          jobTitle: "CTO",
          worksFor: {
            "@type": "Organization",
            name: "AlphaTON Capital",
          },
        },
      },
      {
        "@type": "WebPage",
        name: "HotKeys.ai — 13 Command Keys That Make AI Ship Real Code",
        description:
          "13 command keys that force AI agents to write production-grade code. From the CTO of AlphaTON Capital.",
        url: "https://hotkeys.ai",
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

export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: "Agentic Command Keys",
        description:
          "13 keyboard shortcuts that enforce real engineering discipline on AI agents. A 17-page PDF guide.",
        offers: {
          "@type": "Offer",
          price: "35.00",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://agenthotkeys.com/#pricing",
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
        name: "Agentic Command Keys — Logan Golema | AlphaTON Capital",
        description:
          "13 hotkeys that turn AI into a real engineer. From the CTO of AlphaTON Capital.",
        url: "https://agenthotkeys.com",
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

import Hero from "@/components/sections/Hero";
import Story from "@/components/sections/Story";
import SocialProof from "@/components/sections/SocialProof";
import Commands from "@/components/sections/Commands";
import Pricing from "@/components/sections/Pricing";
import Newsletter from "@/components/sections/Newsletter";
import JsonLd from "@/components/seo/JsonLd";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Story />
      <SocialProof />
      <Commands />
      <Pricing />
      <Newsletter />
      <JsonLd />
    </main>
  );
}

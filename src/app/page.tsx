import Hero from "@/components/sections/Hero";
import Story from "@/components/sections/Story";
import SocialProof from "@/components/sections/SocialProof";
import PlatformFeatures from "@/components/sections/PlatformFeatures";
import PainQuestions from "@/components/sections/PainQuestions";
import Pricing from "@/components/sections/Pricing";
import AIAgentSection from "@/components/sections/AIAgentSection";
import Newsletter from "@/components/sections/Newsletter";
import JsonLd from "@/components/seo/JsonLd";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Story />
      <SocialProof />
      <PlatformFeatures />
      <PainQuestions />
      <Pricing />
      <AIAgentSection />
      <Newsletter />
      <JsonLd />
    </main>
  );
}

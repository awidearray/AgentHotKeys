import Hero from "@/components/sections/Hero";
import Story from "@/components/sections/Story";
import SocialProof from "@/components/sections/SocialProof";
import PainQuestions from "@/components/sections/PainQuestions";
import Pricing from "@/components/sections/Pricing";
import Newsletter from "@/components/sections/Newsletter";
import JsonLd from "@/components/seo/JsonLd";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Story />
      <SocialProof />
      <PainQuestions />
      <Pricing />
      <Newsletter />
      <JsonLd />
    </main>
  );
}

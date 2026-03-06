import Badge from "@/components/ui/Badge";
import GradientText from "@/components/ui/GradientText";
import Button from "@/components/ui/Button";

export default function PlatformFeatures() {
  return (
    <section className="py-16 md:py-24 bg-bg-card/30">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="hero" className="mb-6">
            Built by Creators, for Creators
          </Badge>
          <h2 className="text-3xl md:text-5xl font-black leading-tight mb-6">
            Join the <GradientText>Creator Economy</GradientText>
          </h2>
          <p className="text-xl text-text-dim max-w-[600px] mx-auto leading-relaxed">
            Transform your hotkey expertise into recurring revenue. Our platform 
            handles licensing, payments, and distribution across multiple editors.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-bg-card border border-border rounded-2xl p-8">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-bold mb-4">70% Revenue Share</h3>
            <p className="text-text-dim leading-relaxed mb-6">
              Keep 70% of every sale. We handle payments, licensing, and distribution. 
              You focus on creating great hotkeys.
            </p>
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Creator (You)</span>
                <span className="font-bold text-accent">70%</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Platform</span>
                <span>20%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Infrastructure</span>
                <span>10%</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-8">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold mb-4">Multi-Editor Support</h3>
            <p className="text-text-dim leading-relaxed mb-6">
              Your hotkeys work across VS Code, JetBrains IDEs, and Sublime Text. 
              One upload, universal compatibility.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="key">VS Code</Badge>
              <Badge variant="key">IntelliJ</Badge>
              <Badge variant="key">WebStorm</Badge>
              <Badge variant="key">Sublime</Badge>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-8">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold mb-4">AI Agent Ready</h3>
            <p className="text-text-dim leading-relaxed mb-6">
              AI agents can programmatically purchase and install your hotkeys 
              via our API. Expand your market beyond human users.
            </p>
            <div className="bg-bg border border-border rounded-lg p-3 font-mono text-xs text-accent">
              POST /api/ai-agent/generate-license
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-accent/5 to-accent-bright/5 border border-accent/20 rounded-2xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Ready to Earn from Your Expertise?
            </h3>
            <p className="text-lg text-text-dim mb-8 leading-relaxed">
              Join 500+ creators who've earned over $50,000 collectively from their hotkey collections. 
              Upload your first pack in under 5 minutes.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button variant="primary" href="/auth/signup?type=creator">
                Become a Creator
              </Button>
              <Button variant="secondary" href="/creators/learn-more">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
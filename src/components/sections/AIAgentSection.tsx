import Badge from "@/components/ui/Badge";
import GradientText from "@/components/ui/GradientText";
import Button from "@/components/ui/Button";

export default function AIAgentSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="hero" className="mb-6">
              For AI Developers
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black leading-tight mb-6">
              <GradientText>Programmatic Access</GradientText>
              <br />
              for AI Agents
            </h2>
            <p className="text-lg text-text-dim leading-relaxed mb-8">
              Integrate hotkey licensing directly into your AI workflows. 
              Generate bulk licenses, track usage, and automate installations 
              across your entire development pipeline.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <span>Bulk license generation API</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <span>Automated multi-editor installation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <span>Usage analytics and reporting</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <span>Revenue sharing for AI-generated content</span>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button variant="primary" href="/ai-agents/get-started">
                Get API Access
              </Button>
              <Button variant="secondary" href="/docs/api">
                View Documentation
              </Button>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="bg-bg rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-text-dim text-sm ml-2">Terminal</span>
              </div>
              <div className="font-mono text-sm space-y-2">
                <div className="text-accent">$ curl -X POST https://api.hotkeys.ai/v1/ai-agent/generate-license \\</div>
                <div className="text-text-dim">  -H "X-API-Key: your_api_key" \\</div>
                <div className="text-text-dim">  -H "Content-Type: application/json" \\</div>
                <div className="text-text-dim">  -d {'\''}{'{'}{'\''}</div>
                <div className="text-text-dim ml-4">"hotkey_pack_ids": ["pack_123", "pack_456"],</div>
                <div className="text-text-dim ml-4">"buyer_user_id": "user_789",</div>
                <div className="text-text-dim ml-4">"tier": "pro",</div>
                <div className="text-text-dim ml-4">"max_devices": 5</div>
                <div className="text-text-dim">  {'}'}{'\''}</div>
                <div className="text-green-400 mt-3">✓ License AIAG-XK2L-9M8N-Q4P7 generated</div>
                <div className="text-green-400">✓ Revenue share: $21.00 to creator</div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-text-dim mb-2">Trusted by AI teams at</p>
              <div className="flex gap-4 justify-center opacity-60">
                <span className="text-lg">OpenAI</span>
                <span className="text-lg">Anthropic</span>
                <span className="text-lg">Cursor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
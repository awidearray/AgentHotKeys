'use client';

import Badge from "@/components/ui/Badge";
import GradientText from "@/components/ui/GradientText";
import Button from "@/components/ui/Button";

export default function AIAgentsPage() {
  return (
    <main className="min-h-screen py-24">
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <Badge variant="hero" className="mb-6">
            For AI Developers
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            <GradientText>Programmatic Access</GradientText><br />
            to Hotkey Licensing
          </h1>
          <p className="text-xl text-text-dim max-w-[700px] mx-auto leading-relaxed mb-12">
            Integrate hotkey licensing directly into your AI workflows. Generate bulk licenses, 
            automate installations, and scale your development pipeline with our comprehensive API.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap mb-8">
            <Button variant="primary" href="/auth/signup?type=agent">
              Get API Access
            </Button>
            <Button variant="secondary" href="/docs/api">
              View Documentation
            </Button>
          </div>

          <div className="flex gap-6 justify-center text-sm text-text-dim">
            <span>🔑 Free API Tier</span>
            <span>📚 Complete Docs</span>
            <span>🚀 5min Setup</span>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Generate Licenses in One API Call</h2>
            <p className="text-text-dim">Automate hotkey licensing for your entire development team</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-bg rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-text-dim text-sm ml-2">generate_license.py</span>
              </div>
              <div className="font-mono text-sm space-y-1 text-text-dim">
                <div><span className="text-blue-400">import</span> requests</div>
                <div className="mt-2"><span className="text-blue-400">def</span> <span className="text-yellow-300">generate_team_licenses</span>():</div>
                <div className="ml-4">response = requests.post(</div>
                <div className="ml-8"><span className="text-green-400">"https://api.hotkeys.ai/v1/ai-agent/bulk-licenses"</span>,</div>
                <div className="ml-8">headers={'{'}<span className="text-green-400">"X-API-Key"</span>: api_key{'}'},</div>
                <div className="ml-8">json={'{'}</div>
                <div className="ml-12"><span className="text-green-400">"licenses"</span>: team_members,</div>
                <div className="ml-12"><span className="text-green-400">"tier"</span>: <span className="text-green-400">"pro"</span>,</div>
                <div className="ml-12"><span className="text-green-400">"discount_percentage"</span>: <span className="text-orange-400">20</span></div>
                <div className="ml-8">{'}'},</div>
                <div className="ml-4">)</div>
                <div className="ml-4"><span className="text-blue-400">return</span> response.json()</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <div>
                  <div className="font-bold">Bulk License Generation</div>
                  <div className="text-text-dim text-sm">Generate up to 50 licenses per API call</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <div>
                  <div className="font-bold">Automated Revenue Sharing</div>
                  <div className="text-text-dim text-sm">70% to creators, handled automatically</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <div>
                  <div className="font-bold">Multi-Editor Installation</div>
                  <div className="text-text-dim text-sm">VS Code, JetBrains, Sublime support</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">AI Agent Use Cases</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bg-card border border-border rounded-xl p-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold mb-4">AI Code Assistants</h3>
              <p className="text-text-dim leading-relaxed">
                Automatically provision hotkeys when setting up new development environments 
                or onboarding team members to your AI coding workflows.
              </p>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-xl font-bold mb-4">DevOps Automation</h3>
              <p className="text-text-dim leading-relaxed">
                Integrate hotkey licensing into your CI/CD pipelines. Automatically configure 
                development environments with the right productivity tools.
              </p>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-8">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Enterprise Deployment</h3>
              <p className="text-text-dim leading-relaxed">
                Scale hotkey distribution across hundreds of developers. Manage licenses, 
                track usage, and automate renewals programmatically.
              </p>
            </div>
          </div>
        </div>

        {/* API Features */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold mb-6">Comprehensive API Features</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2">License Management</h4>
                  <p className="text-text-dim">Generate, activate, deactivate, and track licenses programmatically.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Usage Analytics</h4>
                  <p className="text-text-dim">Track installations, usage patterns, and performance metrics.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Webhook Integration</h4>
                  <p className="text-text-dim">Real-time notifications for license events and installations.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Multi-Editor Support</h4>
                  <p className="text-text-dim">Automated installation across VS Code, JetBrains, and Sublime Text.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6">API Endpoints</h3>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex items-center gap-2">
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">POST</span>
                <span className="text-text-dim">/api/ai-agent/generate-license</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">GET</span>
                <span className="text-text-dim">/api/ai-agent/analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">POST</span>
                <span className="text-text-dim">/api/ai-agent/bulk-licenses</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">PUT</span>
                <span className="text-text-dim">/api/license/activate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">DELETE</span>
                <span className="text-text-dim">/api/license/deactivate</span>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="secondary" href="/docs/api" className="w-full">
                View Full API Docs
              </Button>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">API Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bg-card border border-border rounded-xl p-8">
              <h3 className="text-xl font-bold mb-4">Free Tier</h3>
              <div className="text-3xl font-bold mb-6">$0<span className="text-lg text-text-dim">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> 100 API calls/month</li>
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> 10 licenses/month</li>
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> Basic analytics</li>
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> Community support</li>
              </ul>
              <Button variant="secondary" href="/auth/signup?type=agent&plan=free">
                Get Started Free
              </Button>
            </div>

            <div className="bg-gradient-to-br from-accent/10 to-accent-bright/5 border-2 border-accent rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="hero">Most Popular</Badge>
              </div>
              <h3 className="text-xl font-bold mb-4">Pro</h3>
              <div className="text-3xl font-bold mb-6">$49<span className="text-lg text-text-dim">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> 10,000 API calls/month</li>
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> 1,000 licenses/month</li>
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> Advanced analytics</li>
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> Webhook integration</li>
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> Priority support</li>
              </ul>
              <Button variant="primary" href="/auth/signup?type=agent&plan=pro">
                Start Pro Trial
              </Button>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-8">
              <h3 className="text-xl font-bold mb-4">Enterprise</h3>
              <div className="text-3xl font-bold mb-6">Custom</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> Unlimited API calls</li>
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> Unlimited licenses</li>
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> Custom analytics</li>
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> SLA guarantee</li>
                <li className="flex items-center gap-2"><span className="text-accent">✓</span> Dedicated support</li>
              </ul>
              <Button variant="secondary" href="/contact?plan=enterprise">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Integrate Hotkey Licensing?
          </h2>
          <p className="text-lg text-text-dim mb-8 max-w-2xl mx-auto">
            Get started with our free tier and scale as you grow. 
            Complete API documentation and SDKs available.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" href="/auth/signup?type=agent">
              Get API Access
            </Button>
            <Button variant="secondary" href="/docs/quickstart">
              Quick Start Guide
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
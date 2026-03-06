'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GradientText from '@/components/ui/GradientText';

const quickStartSteps = [
  {
    number: '01',
    title: 'Create Account',
    description: 'Sign up for a free AI agent account to get started',
    href: '/auth/signup?type=agent',
    cta: 'Sign Up Free'
  },
  {
    number: '02',
    title: 'Get API Key',
    description: 'Generate your API key from the dashboard',
    href: '/dashboard/api-keys',
    cta: 'Get API Key'
  },
  {
    number: '03',
    title: 'Make First Call',
    description: 'Generate your first license with our API',
    href: '/docs/quickstart',
    cta: 'View Tutorial'
  }
];

const documentationSections = [
  {
    icon: '🚀',
    title: 'Quick Start Guide',
    description: 'Get up and running with the HotKeys.ai API in under 5 minutes',
    href: '/docs/quickstart',
    items: ['Account setup', 'API authentication', 'First API call', 'SDK installation']
  },
  {
    icon: '📚',
    title: 'API Reference',
    description: 'Complete API documentation with examples and SDKs',
    href: '/docs/api',
    items: ['Authentication', 'Endpoints', 'Rate limits', 'Error handling']
  },
  {
    icon: '💡',
    title: 'Integration Guides',
    description: 'Step-by-step guides for popular platforms and frameworks',
    href: '/docs/integrations',
    items: ['Node.js/Python/Go', 'CI/CD pipelines', 'Docker deployment', 'Webhooks']
  },
  {
    icon: '🔧',
    title: 'SDK Documentation',
    description: 'Official SDKs for popular programming languages',
    href: '/docs/sdks',
    items: ['JavaScript/TypeScript', 'Python', 'Go', 'cURL examples']
  },
  {
    icon: '💼',
    title: 'Use Cases',
    description: 'Real-world examples and implementation patterns',
    href: '/docs/use-cases',
    items: ['AI coding assistants', 'DevOps automation', 'Team onboarding', 'Enterprise deployment']
  },
  {
    icon: '🛟',
    title: 'Support & FAQ',
    description: 'Common questions and troubleshooting guides',
    href: '/support',
    items: ['Troubleshooting', 'Rate limit guides', 'Best practices', 'Contact support']
  }
];

const popularEndpoints = [
  {
    method: 'POST',
    endpoint: '/api/ai-agent/generate-license',
    description: 'Generate a single license for a specific tier'
  },
  {
    method: 'POST',
    endpoint: '/api/ai-agent/bulk-licenses',
    description: 'Generate multiple licenses in bulk with discounts'
  },
  {
    method: 'GET',
    endpoint: '/api/ai-agent/analytics',
    description: 'Get usage statistics and analytics data'
  },
  {
    method: 'PUT',
    endpoint: '/api/license/activate',
    description: 'Activate a license key for a user'
  }
];

const codeExample = `import { HotKeysClient } from '@hotkeys/sdk';

const client = new HotKeysClient({
  apiKey: process.env.HOTKEYS_API_KEY
});

// Generate a single license
const license = await client.generateLicense({
  tier: 'pro',
  userEmail: 'developer@company.com'
});

console.log('License generated:', license.key);`;

export default function DocsPage() {
  return (
    <main className="min-h-screen py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <Badge variant="hero" className="mb-6">
            Documentation
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            <GradientText>Developer Documentation</GradientText>
          </h1>
          <p className="text-xl text-text-dim max-w-[700px] mx-auto leading-relaxed mb-12">
            Everything you need to integrate HotKeys.ai into your AI workflows. 
            Complete API reference, SDKs, and step-by-step guides.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap mb-8">
            <Button variant="primary" href="/docs/quickstart">
              Quick Start Guide
            </Button>
            <Button variant="secondary" href="/docs/api">
              API Reference
            </Button>
          </div>

          <div className="flex gap-6 justify-center text-sm text-text-dim">
            <span>⚡ 5min Setup</span>
            <span>🔑 Free API Tier</span>
            <span>📖 Complete Examples</span>
          </div>
        </div>

        {/* Quick Start Steps */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-12">Get Started in 3 Steps</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {quickStartSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-accent">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                <p className="text-text-dim mb-6 leading-relaxed">{step.description}</p>
                <Button variant="secondary" href={step.href} className="w-full">
                  {step.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Start Coding in Seconds</h2>
            <p className="text-text-dim">Generate your first license with just a few lines of code</p>
          </div>
          
          <div className="bg-bg rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-text-dim text-sm ml-2">example.js</span>
            </div>
            <pre className="text-sm text-text-dim overflow-x-auto">
              <code className="language-javascript">{codeExample}</code>
            </pre>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Documentation</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {documentationSections.map((section, index) => (
              <Link 
                key={index}
                href={section.href}
                className="bg-bg-card border border-border hover:border-accent rounded-xl p-6 transition-all group"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <span className="text-2xl">{section.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{section.title}</h3>
                <p className="text-text-dim mb-6 leading-relaxed">{section.description}</p>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2 text-sm text-text-dim">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Endpoints */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 mb-20">
          <h2 className="text-2xl font-bold mb-8">Popular API Endpoints</h2>
          <div className="space-y-4">
            {popularEndpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-bg border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${
                      endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                      endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                      endpoint.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                      endpoint.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {endpoint.method}
                  </Badge>
                  <div>
                    <p className="font-mono text-sm">{endpoint.endpoint}</p>
                    <p className="text-text-dim text-xs mt-1">{endpoint.description}</p>
                  </div>
                </div>
                <Button variant="secondary" href="/docs/api" className="text-sm">
                  View Docs
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-gradient-to-br from-accent/10 to-accent-bright/5 border border-accent/20 rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4">Join Our Community</h3>
            <p className="text-text-dim mb-6">
              Connect with other developers, share integrations, and get help from our team.
            </p>
            <div className="flex gap-3">
              <Button variant="primary" href="/discord">
                Discord Community
              </Button>
              <Button variant="secondary" href="/support">
                Get Support
              </Button>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4">Need Help?</h3>
            <p className="text-text-dim mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="space-y-3">
              <Link href="/support" className="flex items-center gap-2 text-sm hover:text-accent transition-colors">
                <span>📚</span> Browse FAQ & Guides
              </Link>
              <Link href="/contact" className="flex items-center gap-2 text-sm hover:text-accent transition-colors">
                <span>✉️</span> Contact Support Team
              </Link>
              <Link href="/docs/api" className="flex items-center gap-2 text-sm hover:text-accent transition-colors">
                <span>🔧</span> API Reference
              </Link>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Start Building?
          </h2>
          <p className="text-lg text-text-dim mb-8 max-w-2xl mx-auto">
            Get your free API key and start integrating HotKeys.ai into your projects today.
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
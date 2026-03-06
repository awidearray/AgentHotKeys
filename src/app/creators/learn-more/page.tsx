'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GradientText from '@/components/ui/GradientText';

const revenueCalculator = {
  tiers: {
    basic: { price: 9.99, share: 0.7 },
    pro: { price: 19.99, share: 0.7 },
    enterprise: { price: 49.99, share: 0.7 }
  }
};

const successStories = [
  {
    name: 'Logan Golema',
    role: 'Creator of DevBoost Hotkeys',
    avatar: '👨‍💻',
    revenue: '$12,400',
    period: 'Last 3 months',
    quote: 'HotKeys.ai transformed my productivity shortcuts into a sustainable income stream. The platform handles everything - payments, distribution, licensing.',
    metrics: {
      sales: 1240,
      rating: 4.9,
      countries: 47
    }
  },
  {
    name: 'Sarah Chen',
    role: 'UX Designer & Hotkey Creator',
    avatar: '👩‍🎨',
    revenue: '$8,950',
    period: 'Last 2 months',
    quote: 'I never thought my Figma shortcuts would become a business. The automated licensing and revenue sharing make it completely passive income.',
    metrics: {
      sales: 598,
      rating: 4.8,
      countries: 23
    }
  },
  {
    name: 'Alex Martinez',
    role: 'Full-Stack Developer',
    avatar: '⚡',
    revenue: '$15,200',
    period: 'Last 4 months',
    quote: 'Created VS Code shortcuts for React development. Now earning more from my hotkeys than some freelance projects. The demand is incredible.',
    metrics: {
      sales: 1520,
      rating: 4.9,
      countries: 31
    }
  }
];

const creationProcess = [
  {
    step: 1,
    title: 'Identify Your Expertise',
    description: 'What tools do you use daily? Where are your efficiency shortcuts?',
    icon: '💡',
    examples: [
      'VS Code shortcuts for specific frameworks',
      'Adobe Creative Suite power-user workflows',
      'Excel/Google Sheets productivity tricks',
      'Terminal/CLI automation sequences',
      'Browser productivity shortcuts'
    ]
  },
  {
    step: 2,
    title: 'Document Your Shortcuts',
    description: 'Create comprehensive, organized hotkey collections',
    icon: '📝',
    checklist: [
      'Clear, descriptive naming for each shortcut',
      'Organized by category or workflow',
      'Include context and use cases',
      'Test on different systems/versions',
      'Create installation instructions'
    ]
  },
  {
    step: 3,
    title: 'Package & Price',
    description: 'Choose the right tier and pricing strategy',
    icon: '📦',
    tiers: [
      { name: 'Basic', price: '$9.99', for: 'Simple shortcut collections (10-25 shortcuts)' },
      { name: 'Pro', price: '$19.99', for: 'Comprehensive workflows (25-100 shortcuts)' },
      { name: 'Enterprise', price: '$49.99', for: 'Complete productivity systems (100+ shortcuts)' }
    ]
  },
  {
    step: 4,
    title: 'Launch & Promote',
    description: 'Get your hotkeys discovered by the right audience',
    icon: '🚀',
    strategies: [
      'Share in relevant developer communities',
      'Create tutorial videos/blog posts',
      'Engage with users for feedback',
      'Update and expand based on requests',
      'Build your creator brand'
    ]
  }
];

const marketplaceFeatures = [
  {
    title: 'Automated Licensing',
    description: 'Every purchase automatically generates secure license keys',
    icon: '🔐',
    benefit: 'No manual work - fully automated sales process'
  },
  {
    title: '70% Revenue Share',
    description: 'Industry-leading creator revenue share',
    icon: '💰',
    benefit: 'Keep more of what you earn compared to other platforms'
  },
  {
    title: 'Global Distribution',
    description: 'Reach developers worldwide through our marketplace',
    icon: '🌍',
    benefit: 'Built-in discovery and international payment processing'
  },
  {
    title: 'Usage Analytics',
    description: 'Detailed insights into your sales and user engagement',
    icon: '📊',
    benefit: 'Make data-driven decisions about updates and pricing'
  },
  {
    title: 'Instant Payouts',
    description: 'Get paid immediately when customers purchase',
    icon: '⚡',
    benefit: 'No waiting periods or minimum thresholds'
  },
  {
    title: 'Creator Support',
    description: 'Dedicated support team to help you succeed',
    icon: '🛟',
    benefit: 'Marketing advice, technical help, and community access'
  }
];

const faqs = [
  {
    question: 'How much can I realistically earn?',
    answer: 'Top creators earn $5k-$15k per month. Your earnings depend on the value and uniqueness of your hotkeys, marketing effort, and target audience size. Most successful creators start seeing consistent income within 2-3 months.'
  },
  {
    question: 'What types of hotkeys sell best?',
    answer: 'Development-focused shortcuts (VS Code, IDEs), design tools (Adobe Creative Suite, Figma), and productivity applications (Excel, Notion) perform exceptionally well. The key is solving real pain points for specific user groups.'
  },
  {
    question: 'How do I protect my intellectual property?',
    answer: 'Our licensing system includes DRM protection and usage tracking. Each purchase generates a unique license key tied to the user, preventing unauthorized sharing while still allowing legitimate use across their devices.'
  },
  {
    question: 'Can I update my hotkeys after publishing?',
    answer: 'Yes! You can update your hotkey collections anytime. Existing customers automatically get updates, and you can use feedback to continuously improve your offerings and increase sales.'
  },
  {
    question: 'Do I need to handle customer support?',
    answer: 'We handle all payment processing, license delivery, and technical support. You focus on creating great hotkeys and engaging with users for feedback and improvements.'
  },
  {
    question: 'How do I get discovered on the platform?',
    answer: 'Our marketplace features new and trending hotkeys prominently. Additionally, active creators who engage with the community, create quality content, and maintain high ratings get boosted in search results.'
  }
];

export default function LearnMorePage() {
  const [calculatorInput, setCalculatorInput] = useState({
    tier: 'pro' as keyof typeof revenueCalculator.tiers,
    monthlySales: 100
  });
  
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const calculateRevenue = () => {
    const tierData = revenueCalculator.tiers[calculatorInput.tier];
    const monthlyRevenue = calculatorInput.monthlySales * tierData.price * tierData.share;
    const yearlyRevenue = monthlyRevenue * 12;
    return { monthly: monthlyRevenue, yearly: yearlyRevenue };
  };

  const revenue = calculateRevenue();

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <Badge variant="hero" className="mb-6">
            For Creators
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            Turn Your <GradientText>Shortcuts</GradientText><br />
            Into Recurring Revenue
          </h1>
          <p className="text-xl text-text-dim max-w-[700px] mx-auto leading-relaxed mb-12">
            Monetize your productivity expertise by creating and selling hotkey collections. 
            Join successful creators earning $5k-$15k per month from their keyboard shortcuts.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap mb-8">
            <Button variant="primary" href="/auth/signup?type=creator">
              Start Creating
            </Button>
            <Button variant="secondary" href="#calculator">
              Revenue Calculator
            </Button>
          </div>

          <div className="flex gap-6 justify-center text-sm text-text-dim">
            <span>💰 70% Revenue Share</span>
            <span>⚡ Instant Payouts</span>
            <span>🌍 Global Reach</span>
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Creator Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <div key={index} className="bg-bg-card border border-border rounded-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-2xl">
                    {story.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold">{story.name}</h3>
                    <p className="text-text-dim text-sm">{story.role}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-2xl font-bold text-accent">{story.revenue}</div>
                  <div className="text-text-dim text-sm">{story.period}</div>
                </div>

                <blockquote className="text-text-dim text-sm mb-6 italic">
                  "{story.quote}"
                </blockquote>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                  <div className="text-center">
                    <div className="font-bold">{story.metrics.sales}</div>
                    <div className="text-text-dim text-xs">Sales</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{story.metrics.rating}</div>
                    <div className="text-text-dim text-xs">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{story.metrics.countries}</div>
                    <div className="text-text-dim text-xs">Countries</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Calculator */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 mb-20" id="calculator">
          <h2 className="text-2xl font-bold text-center mb-8">Revenue Calculator</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Hotkey Tier</label>
                <select
                  value={calculatorInput.tier}
                  onChange={(e) => setCalculatorInput(prev => ({ ...prev, tier: e.target.value as any }))}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="basic">Basic ($9.99)</option>
                  <option value="pro">Pro ($19.99)</option>
                  <option value="enterprise">Enterprise ($49.99)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  Monthly Sales: {calculatorInput.monthlySales}
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={calculatorInput.monthlySales}
                  onChange={(e) => setCalculatorInput(prev => ({ ...prev, monthlySales: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-text-dim mt-2">
                  <span>10 sales</span>
                  <span>500 sales</span>
                </div>
              </div>
            </div>

            <div className="bg-bg border border-border rounded-xl p-8">
              <h3 className="text-xl font-bold mb-6">Your Projected Revenue</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-dim">Monthly Revenue:</span>
                  <span className="text-2xl font-bold text-accent">
                    ${revenue.monthly.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-text-dim">Yearly Revenue:</span>
                  <span className="text-3xl font-bold">
                    ${revenue.yearly.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <p className="text-accent text-sm font-medium">💡 Pro Tip</p>
                <p className="text-text-dim text-xs mt-1">
                  Most successful creators start with one focused collection, then expand based on user feedback.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Creation Process */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">How to Create Successful Hotkeys</h2>
          <div className="space-y-8">
            {creationProcess.map((process, index) => (
              <div key={index} className="bg-bg-card border border-border rounded-xl p-8">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                      {process.icon}
                    </div>
                    <div className="text-center">
                      <Badge variant="secondary" className="bg-accent/20 text-accent">
                        Step {process.step}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold mb-3">{process.title}</h3>
                    <p className="text-text-dim mb-6">{process.description}</p>

                    {process.examples && (
                      <div>
                        <h4 className="font-medium mb-3">Popular Categories:</h4>
                        <ul className="space-y-2">
                          {process.examples.map((example, exampleIndex) => (
                            <li key={exampleIndex} className="flex items-center gap-2 text-sm text-text-dim">
                              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {process.checklist && (
                      <div>
                        <h4 className="font-medium mb-3">Checklist:</h4>
                        <div className="space-y-2">
                          {process.checklist.map((item, itemIndex) => (
                            <label key={itemIndex} className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 text-accent bg-bg border-border rounded" />
                              <span className="text-sm text-text-dim">{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {process.tiers && (
                      <div className="grid md:grid-cols-3 gap-4">
                        {process.tiers.map((tier, tierIndex) => (
                          <div key={tierIndex} className="bg-bg border border-border rounded-lg p-4">
                            <h5 className="font-bold">{tier.name}</h5>
                            <div className="text-accent font-bold">{tier.price}</div>
                            <p className="text-text-dim text-sm mt-2">{tier.for}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {process.strategies && (
                      <div>
                        <h4 className="font-medium mb-3">Marketing Strategies:</h4>
                        <ul className="space-y-2">
                          {process.strategies.map((strategy, strategyIndex) => (
                            <li key={strategyIndex} className="flex items-center gap-2 text-sm text-text-dim">
                              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                              {strategy}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose HotKeys.ai</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {marketplaceFeatures.map((feature, index) => (
              <div key={index} className="bg-bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-text-dim mb-4">{feature.description}</p>
                <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
                  <p className="text-accent text-sm font-medium">{feature.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-[800px] mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-bg-card/50 transition-colors"
                >
                  <h3 className="font-bold">{faq.question}</h3>
                  <span className="text-text-dim">
                    {expandedFaq === index ? '−' : '+'}
                  </span>
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6 border-t border-border">
                    <p className="text-text-dim leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-accent/10 to-accent-bright/5 border border-accent/20 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Start Your Creator Journey?
          </h2>
          <p className="text-lg text-text-dim mb-8 max-w-2xl mx-auto">
            Join hundreds of creators who have turned their productivity shortcuts into sustainable income streams.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" href="/auth/signup?type=creator">
              Become a Creator
            </Button>
            <Button variant="secondary" href="/creators">
              View Creator Hub
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
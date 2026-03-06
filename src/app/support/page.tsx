'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GradientText from '@/components/ui/GradientText';

const faqCategories = [
  {
    name: 'Getting Started',
    icon: '🚀',
    faqs: [
      {
        question: 'How do I create an account?',
        answer: 'Visit our signup page and choose your account type (Creator, AI Agent, or Human). Verify your email and you\'ll have access to your dashboard immediately. Free accounts include basic features to get you started.'
      },
      {
        question: 'What\'s the difference between account types?',
        answer: 'Creators can upload and sell hotkeys, AI Agents get API access for programmatic license generation, and Human accounts can browse and purchase hotkeys. You can upgrade your account type anytime from your settings.'
      },
      {
        question: 'Is there a free plan?',
        answer: 'Yes! We offer free tiers for all account types. Creators get free marketplace listing, AI Agents get 100 API calls/month, and Human accounts can browse and purchase with no fees.'
      },
      {
        question: 'How quickly can I start selling hotkeys?',
        answer: 'After account verification, you can upload your first hotkey collection immediately. It takes 24-48 hours for review and approval before going live on the marketplace.'
      }
    ]
  },
  {
    name: 'API & Integration',
    icon: '🔧',
    faqs: [
      {
        question: 'How do I get my API key?',
        answer: 'Navigate to your Dashboard → API Keys section. Click "Generate New Key", give it a name, and copy the key immediately (it won\'t be shown again). Store it securely in your environment variables.'
      },
      {
        question: 'What are the rate limits?',
        answer: 'Free tier: 100 API calls/hour. Pro: 10,000 calls/hour. Enterprise: Unlimited. Rate limits reset every hour. Use our SDKs for automatic retry with exponential backoff.'
      },
      {
        question: 'How do I test the API?',
        answer: 'Use our interactive API docs at /docs/api, try our Quick Start guide, or use tools like Postman with your API key in the Authorization header as "Bearer YOUR_KEY".'
      },
      {
        question: 'Can I use the API in production?',
        answer: 'Absolutely! Our API is production-ready with 99.9% uptime SLA for Pro and Enterprise plans. Use proper error handling and respect rate limits for best performance.'
      },
      {
        question: 'Do you have webhooks?',
        answer: 'Yes! Enterprise plans include webhook support for license generation, activation, and other events. Configure webhook URLs in your dashboard settings.'
      }
    ]
  },
  {
    name: 'Licensing & Usage',
    icon: '🔑',
    faqs: [
      {
        question: 'How do hotkey licenses work?',
        answer: 'Each license is a unique key tied to specific hotkey collections. Users install licenses in their editors (VS Code, JetBrains, etc.) to access premium shortcuts and workflows.'
      },
      {
        question: 'Can I share my license with team members?',
        answer: 'Individual licenses are for single users. For teams, use our bulk licensing options or AI Agent API to generate multiple licenses with volume discounts.'
      },
      {
        question: 'What happens if I lose my license key?',
        answer: 'Contact support with your purchase email. We can resend your license keys or help you recover them from your account dashboard.'
      },
      {
        question: 'Do licenses expire?',
        answer: 'By default, licenses don\'t expire. However, creators can set expiration dates, and enterprise customers can configure custom expiration policies.'
      },
      {
        question: 'Can I refund a license?',
        answer: 'Yes, we offer 30-day refunds for individual purchases. Bulk licenses and enterprise agreements may have different refund terms outlined in your contract.'
      }
    ]
  },
  {
    name: 'Creator Support',
    icon: '👨‍💻',
    faqs: [
      {
        question: 'How much do creators earn?',
        answer: 'Creators keep 70% of sales revenue - one of the highest rates in the industry. Top creators earn $5k-$15k monthly. Payments are processed instantly with no minimum thresholds.'
      },
      {
        question: 'What file formats are supported?',
        answer: 'We support JSON, XML, and proprietary formats for VS Code, JetBrains IDEs, Sublime Text, Vim, and other popular editors. Our upload system auto-detects formats.'
      },
      {
        question: 'How do I price my hotkeys?',
        answer: 'We recommend: Basic ($9.99) for 10-25 shortcuts, Pro ($19.99) for comprehensive collections, Enterprise ($49.99) for complete productivity systems. Monitor competitor pricing for guidance.'
      },
      {
        question: 'Can I update my hotkeys after publishing?',
        answer: 'Yes! Upload new versions anytime. Existing customers automatically get updates. Use semantic versioning and update notes to communicate changes clearly.'
      },
      {
        question: 'How do I market my hotkeys?',
        answer: 'Share in developer communities, create tutorial content, engage with users for feedback, and maintain high quality. Our marketplace also features trending and new releases prominently.'
      }
    ]
  },
  {
    name: 'Billing & Payments',
    icon: '💳',
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer: 'Credit cards, PayPal, Apple Pay, Google Pay, and crypto payments (Bitcoin, Ethereum, USDC). Enterprise customers can also use bank transfers and purchase orders.'
      },
      {
        question: 'When do creators get paid?',
        answer: 'Creators are paid instantly when customers purchase their hotkeys. Funds are available in your account immediately and can be withdrawn to your bank account or PayPal.'
      },
      {
        question: 'Are there any fees?',
        answer: 'No fees for buyers. Creators pay our 30% platform fee (you keep 70%). AI Agent API calls are included in your plan. Payment processing fees are covered by us.'
      },
      {
        question: 'How do I change my billing information?',
        answer: 'Visit Dashboard → Billing Settings to update payment methods, billing addresses, and tax information. Changes take effect on your next billing cycle.'
      },
      {
        question: 'Can I get a refund?',
        answer: 'Yes, we offer 30-day refunds on most purchases. Contact support with your purchase details. Refunds are processed within 5-7 business days to your original payment method.'
      }
    ]
  },
  {
    name: 'Technical Issues',
    icon: '🛠️',
    faqs: [
      {
        question: 'My hotkeys aren\'t working in my editor',
        answer: 'Check: 1) License is properly installed, 2) Editor is restarted after installation, 3) No conflicting shortcuts, 4) Editor version compatibility. Contact support with your setup details.'
      },
      {
        question: 'API calls are failing with 401 errors',
        answer: 'This means authentication failed. Check: 1) API key is correct, 2) Using "Bearer" prefix in Authorization header, 3) Key hasn\'t expired, 4) Account has necessary permissions.'
      },
      {
        question: 'I\'m hitting rate limits',
        answer: 'Implement exponential backoff in your code, consider upgrading your plan, or contact enterprise sales for unlimited usage. Our SDKs handle rate limiting automatically.'
      },
      {
        question: 'License installation fails',
        answer: 'Ensure you have the latest version of your editor, sufficient permissions to install extensions, and a stable internet connection. Try manual installation with our step-by-step guides.'
      },
      {
        question: 'Dashboard is loading slowly',
        answer: 'Clear your browser cache, try in an incognito window, or check your internet connection. If issues persist, we might be experiencing high traffic - check our status page.'
      }
    ]
  }
];

const supportChannels = [
  {
    title: 'Community Discord',
    description: 'Join our active community of creators and developers',
    icon: '💬',
    href: '/discord',
    cta: 'Join Discord',
    responseTime: 'Usually responds within minutes'
  },
  {
    title: 'Email Support',
    description: 'Direct email support for account and technical issues',
    icon: '📧',
    href: 'mailto:support@hotkeys.ai',
    cta: 'Email Us',
    responseTime: 'Response within 24 hours'
  },
  {
    title: 'Live Chat',
    description: 'Instant help during business hours (9 AM - 6 PM PST)',
    icon: '💬',
    href: '#',
    cta: 'Start Chat',
    responseTime: 'Immediate response'
  },
  {
    title: 'Documentation',
    description: 'Comprehensive guides and API reference',
    icon: '📚',
    href: '/docs',
    cta: 'Browse Docs',
    responseTime: 'Self-service'
  }
];

const troubleshootingGuides = [
  {
    title: 'API Authentication Issues',
    description: 'Solve common API key and authentication problems',
    icon: '🔐',
    steps: [
      'Verify your API key is correctly formatted (starts with "hk_api_")',
      'Check Authorization header format: "Bearer YOUR_API_KEY"',
      'Ensure your account type has API access (AI Agent accounts)',
      'Confirm API key hasn\'t expired or been revoked',
      'Test with a simple GET request to /api/ai-agent/analytics'
    ]
  },
  {
    title: 'License Installation Problems',
    description: 'Fix hotkey license installation in your editor',
    icon: '⚙️',
    steps: [
      'Restart your editor after installing the license',
      'Check if your editor version is compatible',
      'Verify no conflicting keyboard shortcuts exist',
      'Try manual installation using our guides',
      'Check editor console/logs for error messages'
    ]
  },
  {
    title: 'Payment & Billing Issues',
    description: 'Resolve payment failures and billing questions',
    icon: '💳',
    steps: [
      'Verify your payment method has sufficient funds',
      'Check if your card supports international transactions',
      'Try a different payment method (PayPal, crypto)',
      'Clear browser cache and cookies',
      'Contact your bank if the transaction was declined'
    ]
  },
  {
    title: 'Creator Upload Problems',
    description: 'Fix issues when uploading hotkey collections',
    icon: '📤',
    steps: [
      'Ensure file format is supported (JSON, XML, proprietary)',
      'Check file size is under 50MB limit',
      'Verify hotkey syntax is correct for target editor',
      'Include proper metadata and descriptions',
      'Test your hotkeys locally before uploading'
    ]
  }
];

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState(faqCategories[0].name);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const selectedFaqs = faqCategories.find(cat => cat.name === selectedCategory)?.faqs || [];

  const filteredFaqs = selectedFaqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="hero" className="mb-6">
            Support Center
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
            <GradientText>How Can We Help?</GradientText>
          </h1>
          <p className="text-xl text-text-dim max-w-[700px] mx-auto leading-relaxed mb-8">
            Find answers to common questions, browse our guides, or contact our support team directly.
          </p>

          {/* Search */}
          <div className="max-w-[600px] mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-card border border-border rounded-xl px-6 py-4 pl-12 focus:outline-none focus:ring-2 focus:ring-accent text-lg"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim">
                🔍
              </div>
            </div>
          </div>

          <div className="flex gap-6 justify-center text-sm text-text-dim">
            <span>💬 Community Discord</span>
            <span>📧 24h Email Support</span>
            <span>📚 Comprehensive Docs</span>
          </div>
        </div>

        {/* Quick Help Channels */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">Get Help Fast</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportChannels.map((channel, index) => (
              <a
                key={index}
                href={channel.href}
                className="bg-bg-card border border-border hover:border-accent rounded-xl p-6 transition-all group"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <span className="text-2xl">{channel.icon}</span>
                </div>
                <h3 className="font-bold mb-2">{channel.title}</h3>
                <p className="text-text-dim text-sm mb-4">{channel.description}</p>
                <div className="text-accent font-medium text-sm">{channel.cta}</div>
                <div className="text-text-dim text-xs mt-2">{channel.responseTime}</div>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          {/* Category Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {faqCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.name 
                    ? 'bg-accent text-bg' 
                    : 'bg-bg-card text-text-dim hover:text-text border border-border'
                }`}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 text-text-dim">
                <p>No FAQs found for "{searchQuery}". Try a different search term or browse categories.</p>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const faqId = `${selectedCategory}-${index}`;
                return (
                  <div key={faqId} className="bg-bg-card border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faqId ? null : faqId)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-bg-card/50 transition-colors"
                    >
                      <h3 className="font-bold">{faq.question}</h3>
                      <span className="text-text-dim">
                        {expandedFaq === faqId ? '−' : '+'}
                      </span>
                    </button>
                    {expandedFaq === faqId && (
                      <div className="px-6 pb-6 border-t border-border">
                        <p className="text-text-dim leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Troubleshooting Guides */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Troubleshooting Guides</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {troubleshootingGuides.map((guide, index) => (
              <div key={index} className="bg-bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">{guide.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold">{guide.title}</h3>
                      <p className="text-text-dim text-sm">{guide.description}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setExpandedGuide(expandedGuide === guide.title ? null : guide.title)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between text-accent font-medium">
                      <span>View Steps</span>
                      <span>{expandedGuide === guide.title ? '▼' : '▶'}</span>
                    </div>
                  </button>
                </div>

                {expandedGuide === guide.title && (
                  <div className="px-6 pb-6 border-t border-border">
                    <ol className="space-y-3 mt-4">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex gap-3 text-sm text-text-dim">
                          <span className="bg-accent/20 text-accent rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {stepIndex + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Still Need Help?
          </h2>
          <p className="text-lg text-text-dim mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you succeed.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-bg border border-border rounded-xl p-6">
              <h3 className="font-bold mb-2">For Creators</h3>
              <p className="text-text-dim text-sm mb-4">
                Get help with uploads, pricing, and marketing your hotkeys
              </p>
              <Button variant="secondary" href="mailto:creators@hotkeys.ai">
                Email Creator Support
              </Button>
            </div>
            <div className="bg-bg border border-border rounded-xl p-6">
              <h3 className="font-bold mb-2">For Developers</h3>
              <p className="text-text-dim text-sm mb-4">
                Technical support for API integration and implementation
              </p>
              <Button variant="secondary" href="mailto:dev@hotkeys.ai">
                Email Dev Support
              </Button>
            </div>
            <div className="bg-bg border border-border rounded-xl p-6">
              <h3 className="font-bold mb-2">Enterprise Support</h3>
              <p className="text-text-dim text-sm mb-4">
                Dedicated support for enterprise customers and custom solutions
              </p>
              <Button variant="secondary" href="/contact">
                Contact Enterprise
              </Button>
            </div>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" href="/discord">
              Join Our Discord
            </Button>
            <Button variant="secondary" href="/docs">
              Browse Documentation
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
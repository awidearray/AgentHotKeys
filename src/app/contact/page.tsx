'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GradientText from '@/components/ui/GradientText';

interface ContactForm {
  name: string;
  email: string;
  company: string;
  role: string;
  teamSize: string;
  plan: string;
  useCase: string;
  message: string;
}

const enterpriseFeatures = [
  {
    title: 'Unlimited API Calls',
    description: 'No limits on API requests - scale as much as you need',
    icon: '∞'
  },
  {
    title: 'Unlimited License Generation',
    description: 'Generate licenses for your entire organization',
    icon: '🎫'
  },
  {
    title: 'Custom Integration Support',
    description: 'Dedicated engineering support for complex integrations',
    icon: '🔧'
  },
  {
    title: 'SLA Guarantees',
    description: '99.9% uptime SLA with priority incident response',
    icon: '🛡️'
  },
  {
    title: 'Advanced Analytics',
    description: 'Custom dashboards and detailed usage analytics',
    icon: '📊'
  },
  {
    title: 'Dedicated Account Manager',
    description: 'Personal support and strategic guidance',
    icon: '👥'
  },
  {
    title: 'White-Label Options',
    description: 'Brand the experience as your own',
    icon: '🏷️'
  },
  {
    title: 'Custom Pricing Tiers',
    description: 'Flexible pricing models for your specific needs',
    icon: '💰'
  },
  {
    title: 'Priority Feature Requests',
    description: 'Influence our roadmap with your specific requirements',
    icon: '🚀'
  }
];

const useCases = [
  {
    title: 'Enterprise AI Development',
    description: 'Large teams building AI-powered applications',
    icon: '🏢',
    examples: [
      'Multi-team development environments',
      'Automated license provisioning',
      'Enterprise security compliance',
      'Custom workflow integration'
    ]
  },
  {
    title: 'DevOps & Infrastructure',
    description: 'Platform teams managing developer productivity',
    icon: '⚙️',
    examples: [
      'CI/CD pipeline integration',
      'Developer onboarding automation',
      'Infrastructure as Code templates',
      'Team productivity monitoring'
    ]
  },
  {
    title: 'Education & Training',
    description: 'Universities and coding bootcamps',
    icon: '🎓',
    examples: [
      'Student license management',
      'Curriculum integration',
      'Bulk license provisioning',
      'Educational pricing models'
    ]
  }
];

const testimonials = [
  {
    quote: "HotKeys.ai transformed our developer onboarding process. What used to take hours now happens automatically when new team members join.",
    author: "Sarah Johnson",
    role: "VP of Engineering",
    company: "TechFlow Inc",
    logo: "🚀"
  },
  {
    quote: "The enterprise features and dedicated support made implementation seamless. ROI was positive within the first month.",
    author: "Michael Chen",
    role: "DevOps Director",
    company: "ScaleBot AI",
    logo: "🤖"
  },
  {
    quote: "Custom pricing and white-label options let us integrate HotKeys.ai as part of our platform. Our customers love the productivity boost.",
    author: "Anna Rodriguez",
    role: "CTO",
    company: "DevPlatform Solutions",
    logo: "🔧"
  }
];

export default function ContactPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    company: '',
    role: '',
    teamSize: '',
    plan: '',
    useCase: '',
    message: ''
  });

  useEffect(() => {
    // Pre-populate form based on URL parameters
    const plan = searchParams?.get('plan');
    if (plan) {
      setFormData(prev => ({ ...prev, plan }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit contact form');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Contact form error:', error);
      setError('Failed to submit form. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (submitted) {
    return (
      <main className="min-h-screen py-24 flex items-center justify-center">
        <div className="max-w-[500px] mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-text-dim mb-8">
            We've received your message and will get back to you within 24 hours. 
            A member of our enterprise team will reach out to discuss your specific needs.
          </p>
          <Button variant="primary" href="/">
            Return to Home
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="hero" className="mb-6">
            Enterprise Sales
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
            <GradientText>Scale Your Team's</GradientText><br />
            Productivity at Enterprise Level
          </h1>
          <p className="text-xl text-text-dim max-w-[700px] mx-auto leading-relaxed mb-8">
            Get custom pricing, dedicated support, and enterprise features designed for large teams and organizations.
          </p>

          <div className="flex gap-4 justify-center flex-wrap mb-8">
            <Button variant="primary" href="#contact-form">
              Get Custom Quote
            </Button>
            <Button variant="secondary" href="/docs/api">
              View Documentation
            </Button>
          </div>

          <div className="flex gap-6 justify-center text-sm text-text-dim">
            <span>🤝 Dedicated Support</span>
            <span>⚡ Custom SLA</span>
            <span>🔧 White-Label Options</span>
          </div>
        </div>

        {/* Enterprise Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Enterprise Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enterpriseFeatures.map((feature, index) => (
              <div key={index} className="bg-bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-text-dim text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Enterprise Use Cases</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-bg-card border border-border rounded-xl p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-3xl">{useCase.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-4">{useCase.title}</h3>
                <p className="text-text-dim mb-6">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.examples.map((example, exampleIndex) => (
                    <li key={exampleIndex} className="flex items-center gap-2 text-sm text-text-dim">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">What Enterprise Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-bg-card border border-border rounded-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.logo}
                  </div>
                  <div>
                    <div className="font-bold">{testimonial.company}</div>
                    <div className="text-text-dim text-sm">{testimonial.author}</div>
                    <div className="text-text-dim text-xs">{testimonial.role}</div>
                  </div>
                </div>
                <blockquote className="text-text-dim italic">
                  "{testimonial.quote}"
                </blockquote>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-[800px] mx-auto" id="contact-form">
          <div className="bg-bg-card border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Get Your Custom Enterprise Quote</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="your.email@company.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Company *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="e.g. CTO, VP Engineering"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Team Size</label>
                  <select
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleInputChange}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select team size</option>
                    <option value="10-50">10-50 developers</option>
                    <option value="50-100">50-100 developers</option>
                    <option value="100-500">100-500 developers</option>
                    <option value="500+">500+ developers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Interest</label>
                  <select
                    name="plan"
                    value={formData.plan}
                    onChange={handleInputChange}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select your interest</option>
                    <option value="enterprise">Enterprise Plan</option>
                    <option value="custom">Custom Integration</option>
                    <option value="white-label">White-Label Solution</option>
                    <option value="consulting">Implementation Consulting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Primary Use Case</label>
                <input
                  type="text"
                  name="useCase"
                  value={formData.useCase}
                  onChange={handleInputChange}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g. Developer onboarding, CI/CD integration, Team productivity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  placeholder="Tell us about your specific requirements, timeline, and any questions you have..."
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-text-dim text-sm mb-4">
                Need to speak with someone immediately?
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <a href="mailto:enterprise@hotkeys.ai" className="text-accent hover:underline text-sm">
                  ✉️ enterprise@hotkeys.ai
                </a>
                <a href="tel:+1-555-HOTKEYS" className="text-accent hover:underline text-sm">
                  📞 +1 (555) HOT-KEYS
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-2 gap-8 mt-16 mb-16">
          <div className="bg-bg-card border border-border rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4">Enterprise Support</h3>
            <ul className="space-y-3 text-text-dim">
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>24/7 priority support with 1-hour response SLA</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>Dedicated customer success manager</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>Private Slack channel with our engineering team</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>Quarterly business reviews and optimization</span>
              </li>
            </ul>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4">Implementation & Onboarding</h3>
            <ul className="space-y-3 text-text-dim">
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>White-glove implementation assistance</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>Custom integration development if needed</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>Team training and best practices workshops</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>Migration assistance from existing solutions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-accent/10 to-accent-bright/5 border border-accent/20 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Scale Your Team's Productivity?
          </h2>
          <p className="text-lg text-text-dim mb-8 max-w-2xl mx-auto">
            Join enterprise customers who have increased their development team productivity by 40% with HotKeys.ai.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" href="#contact-form">
              Get Custom Quote
            </Button>
            <Button variant="secondary" href="/docs/api">
              View API Documentation
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
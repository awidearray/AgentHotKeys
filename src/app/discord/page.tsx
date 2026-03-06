'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GradientText from '@/components/ui/GradientText';

const communityStats = {
  members: '2,847',
  creators: '431',
  aiAgents: '156',
  countries: '47'
};

const channels = [
  {
    name: '🚀 general',
    description: 'Main community chat and introductions',
    memberCount: '2,847',
    isActive: true
  },
  {
    name: '💻 creator-showcase',
    description: 'Share your latest hotkey collections',
    memberCount: '431',
    isActive: true
  },
  {
    name: '🤖 ai-agent-dev',
    description: 'API integration help and code sharing',
    memberCount: '156',
    isActive: true
  },
  {
    name: '🎯 feedback',
    description: 'Platform feedback and feature requests',
    memberCount: '892',
    isActive: false
  },
  {
    name: '💰 revenue-sharing',
    description: 'Success stories and monetization tips',
    memberCount: '324',
    isActive: true
  },
  {
    name: '🆘 support',
    description: 'Get help from the community and team',
    memberCount: '1,234',
    isActive: true
  }
];

const communityFeatures = [
  {
    title: 'Direct Access to Team',
    description: 'Chat directly with HotKeys.ai founders and engineers',
    icon: '👥',
    benefit: 'Get insider updates and influence product direction'
  },
  {
    title: 'Creator Networking',
    description: 'Connect with top-earning creators and learn their strategies',
    icon: '🌟',
    benefit: 'Discover collaboration opportunities and growth tactics'
  },
  {
    title: 'Technical Support',
    description: 'Get help with API integration and troubleshooting',
    icon: '🔧',
    benefit: 'Faster solutions from community experts'
  },
  {
    title: 'Beta Access',
    description: 'First access to new features and early testing opportunities',
    icon: '⚡',
    benefit: 'Shape features before public release'
  },
  {
    title: 'Success Stories',
    description: 'Learn from creators earning $5k-$15k monthly',
    icon: '💡',
    benefit: 'Proven strategies and real revenue insights'
  },
  {
    title: 'Weekly AMAs',
    description: 'Regular Q&A sessions with successful creators and team',
    icon: '🎤',
    benefit: 'Get your questions answered by experts'
  }
];

const testimonials = [
  {
    quote: "The Discord community helped me go from $200/month to $8,000/month in just 4 months. The support and advice from other creators is invaluable.",
    author: "Alex M.",
    role: "VS Code Shortcuts Creator",
    avatar: "👨‍💻",
    revenue: "$8,000/mo"
  },
  {
    quote: "Got my first enterprise client through a connection made in Discord. The networking opportunities alone are worth joining.",
    author: "Sarah K.",
    role: "API Integration Specialist",
    avatar: "👩‍🔬",
    revenue: "$12,000/mo"
  },
  {
    quote: "The technical discussions in #ai-agent-dev saved me weeks of development time. Plus I beta test new features before anyone else.",
    author: "Mike L.",
    role: "AI Agent Developer",
    avatar: "🤖",
    revenue: "$6,500/mo"
  }
];

const upcomingEvents = [
  {
    title: 'Creator Success Workshop',
    date: 'March 15, 2024',
    time: '2:00 PM PST',
    host: 'Logan Golema & Top Creators',
    description: 'Learn the proven strategies top creators use to scale their hotkey businesses',
    attendees: 156
  },
  {
    title: 'API Integration Masterclass',
    date: 'March 22, 2024',
    time: '3:00 PM PST',
    host: 'Engineering Team',
    description: 'Deep dive into advanced API patterns and enterprise integration strategies',
    attendees: 89
  },
  {
    title: 'Monthly Revenue Share',
    date: 'March 30, 2024',
    time: '1:00 PM PST',
    host: 'Community Creators',
    description: 'Open discussion about earnings, challenges, and growth tactics',
    attendees: 203
  }
];

const rules = [
  'Be respectful and helpful to all community members',
  'No spam, self-promotion outside designated channels',
  'Share knowledge freely - we all grow together',
  'Keep discussions relevant to hotkeys and productivity',
  'No harassment or discriminatory language',
  'Use appropriate channels for different topics'
];

export default function DiscordPage() {
  useEffect(() => {
    // Auto-redirect to Discord invite after a short delay if user came from external link
    const params = new URLSearchParams(window.location.search);
    if (params.get('redirect') === 'true') {
      setTimeout(() => {
        window.location.href = 'https://discord.gg/hotkeys-ai';
      }, 3000);
    }
  }, []);

  const handleJoinDiscord = () => {
    // Track Discord join event for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'discord_join', {
        event_category: 'community',
        event_label: 'discord_invite'
      });
    }
    
    // Open Discord invite
    window.open('https://discord.gg/hotkeys-ai', '_blank');
  };

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="hero" className="mb-6">
            Discord Community
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
            Join the <GradientText>HotKeys.ai</GradientText><br />
            Discord Community
          </h1>
          <p className="text-xl text-text-dim max-w-[700px] mx-auto leading-relaxed mb-12">
            Connect with {communityStats.members}+ creators, developers, and productivity enthusiasts. 
            Get help, share knowledge, and grow your hotkeys business together.
          </p>
          
          <Button variant="primary" onClick={handleJoinDiscord} className="text-lg px-8 py-4 mb-8">
            🚀 Join Discord Community
          </Button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[600px] mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{communityStats.members}</div>
              <div className="text-text-dim text-sm">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{communityStats.creators}</div>
              <div className="text-text-dim text-sm">Active Creators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{communityStats.aiAgents}</div>
              <div className="text-text-dim text-sm">AI Developers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{communityStats.countries}</div>
              <div className="text-text-dim text-sm">Countries</div>
            </div>
          </div>
        </div>

        {/* Community Preview */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Discord Channels</h2>
          <div className="bg-bg-card border border-border rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {channels.map((channel, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-bg border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${channel.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    <div>
                      <div className="font-mono font-bold">{channel.name}</div>
                      <div className="text-text-dim text-sm">{channel.description}</div>
                    </div>
                  </div>
                  <div className="text-text-dim text-sm">{channel.memberCount} members</div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-accent/5 border border-accent/20 rounded-xl text-center">
              <p className="text-accent font-medium mb-4">💡 Pro Tip</p>
              <p className="text-text-dim">
                Introduce yourself in #general and share what you're working on. 
                The community loves helping new members get started!
              </p>
            </div>
          </div>
        </div>

        {/* Community Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why Join Our Discord?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {communityFeatures.map((feature, index) => (
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

        {/* Success Stories */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Community Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-bg-card border border-border rounded-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold">{testimonial.author}</div>
                    <div className="text-text-dim text-sm">{testimonial.role}</div>
                    <div className="text-accent text-sm font-bold">{testimonial.revenue}</div>
                  </div>
                </div>
                <blockquote className="text-text-dim italic">
                  "{testimonial.quote}"
                </blockquote>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Upcoming Community Events</h2>
          <div className="space-y-6">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="bg-bg-card border border-border rounded-xl p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    <p className="text-text-dim">{event.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-accent/20 text-accent">
                    {event.attendees} attending
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-accent">📅</span>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-accent">🕒</span>
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-accent">🎤</span>
                    <span>{event.host}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Community Guidelines</h2>
          <div className="bg-bg-card border border-border rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-6">Our Rules</h3>
                <ul className="space-y-3">
                  {rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <span className="bg-accent/20 text-accent rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-text-dim">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-6">What to Expect</h3>
                <div className="space-y-4 text-sm text-text-dim">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Helpful, supportive community members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Regular engagement from the HotKeys.ai team</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Shared knowledge and growth strategies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Early access to new features and updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Networking with like-minded creators</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Fast technical support and troubleshooting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-accent/10 to-accent-bright/5 border border-accent/20 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Join Our Community?
          </h2>
          <p className="text-lg text-text-dim mb-8 max-w-2xl mx-auto">
            Connect with creators earning $5k-$15k monthly, get technical support, 
            and be part of the hotkeys revolution.
          </p>
          <div className="flex gap-4 justify-center flex-wrap mb-6">
            <Button variant="primary" onClick={handleJoinDiscord} className="text-lg px-8 py-4">
              🚀 Join Discord Now
            </Button>
            <Button variant="secondary" href="/support">
              Browse Support
            </Button>
          </div>
          
          <div className="text-sm text-text-dim">
            <p>Free to join • {communityStats.members}+ active members • 24/7 community support</p>
          </div>
        </div>
      </div>
    </main>
  );
}
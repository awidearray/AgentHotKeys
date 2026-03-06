'use client';

import { useState } from 'react';
import Badge from "@/components/ui/Badge";
import GradientText from "@/components/ui/GradientText";
import Button from "@/components/ui/Button";

export default function CreatorsPage() {
  const [earnings, setEarnings] = useState(25); // Default hotkey pack price

  const calculateRevenue = (price: number, sales: number) => {
    const creatorShare = price * 0.7;
    return {
      perSale: creatorShare,
      monthly: creatorShare * sales,
      yearly: creatorShare * sales * 12
    };
  };

  const revenue = calculateRevenue(earnings, 10); // Assuming 10 sales per month

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <Badge variant="hero" className="mb-6">
            For Hotkey Creators
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            Turn Your <GradientText>Hotkey Expertise</GradientText><br />
            Into Recurring Revenue
          </h1>
          <p className="text-xl text-text-dim max-w-[700px] mx-auto leading-relaxed mb-12">
            Join 500+ creators earning from their hotkey collections. Upload once, 
            earn forever. We handle licensing, payments, and distribution across all editors.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" href="/auth/signup?type=creator">
              Start Earning Today
            </Button>
            <Button variant="secondary" href="#revenue-calculator">
              Calculate Your Revenue
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-20">
          <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-3xl font-bold mb-2">500+</div>
            <div className="text-text-dim">Active Creators</div>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-3xl font-bold mb-2">$50k+</div>
            <div className="text-text-dim">Total Payouts</div>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-3xl font-bold mb-2">2,000+</div>
            <div className="text-text-dim">Hotkey Packs</div>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-3xl font-bold mb-2">70%</div>
            <div className="text-text-dim">Revenue Share</div>
          </div>
        </div>

        {/* Revenue Calculator */}
        <div id="revenue-calculator" className="bg-gradient-to-r from-accent/5 to-accent-bright/5 border border-accent/20 rounded-2xl p-8 md:p-12 mb-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Revenue Calculator
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium mb-3">
                  Hotkey Pack Price
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={earnings}
                  onChange={(e) => setEarnings(Number(e.target.value))}
                  className="w-full mb-2"
                />
                <div className="text-center font-mono text-lg font-bold text-accent">
                  ${earnings}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Your share (70%):</span>
                  <span className="font-bold text-accent">${revenue.perSale.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly (10 sales):</span>
                  <span className="font-bold text-accent">${revenue.monthly.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Yearly estimate:</span>
                  <span className="font-bold text-accent">${revenue.yearly.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-bold mb-4">1. Upload Your Hotkeys</h3>
              <p className="text-text-dim">
                Use our simple upload tool to share your hotkey collections. 
                Support for VS Code, JetBrains, and Sublime Text.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-bold mb-4">2. Set Your Price</h3>
              <p className="text-text-dim">
                You control the pricing. We handle licensing, payments, 
                and distribution. Keep 70% of every sale.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold mb-4">3. Track & Earn</h3>
              <p className="text-text-dim">
                Watch your revenue grow with detailed analytics. 
                Get paid monthly via Stripe Connect.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Creator Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Multi-Editor Support</h4>
                  <p className="text-text-dim">Your hotkeys work across VS Code, JetBrains IDEs, and Sublime Text automatically.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Automated Licensing</h4>
                  <p className="text-text-dim">We handle license generation, device limits, and activation automatically.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2">AI Agent Access</h4>
                  <p className="text-text-dim">AI agents can purchase your hotkeys programmatically, expanding your market.</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Revenue Analytics</h4>
                  <p className="text-text-dim">Detailed insights into your sales, top-performing hotkeys, and user engagement.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Monthly Payouts</h4>
                  <p className="text-text-dim">Reliable monthly payments via Stripe Connect. No minimum payout threshold.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Community Support</h4>
                  <p className="text-text-dim">Join our creator Discord for tips, collaboration, and platform updates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-lg text-text-dim mb-8 max-w-2xl mx-auto">
            Upload your first hotkey pack in under 5 minutes. No upfront costs, 
            no monthly fees. You only pay when you earn.
          </p>
          <Button variant="primary" href="/auth/signup?type=creator" className="text-lg px-8 py-4">
            Become a Creator
          </Button>
        </div>
      </div>
    </main>
  );
}
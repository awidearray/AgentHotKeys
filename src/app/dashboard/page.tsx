'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { safeDbOperation } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalHotkeys: 0,
    totalSales: 0,
    totalRevenue: 0,
    activeSubscription: false,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserStats();
    }
  }, [session]);

  async function fetchUserStats() {
    if (!session?.user?.id) return;
    
    setStatsLoading(true);
    setStatsError(null);

    try {
      // Fetch user's hotkeys
      const hotkeysResult = await safeDbOperation(async () => {
        const { supabaseAdmin } = await import('@/lib/supabase/client');
        return await supabaseAdmin
          .from('hotkeys')
          .select('id')
          .eq('creator_id', session.user.id);
      });

      // Fetch user's purchases 
      const purchasesResult = await safeDbOperation(async () => {
        const { supabaseAdmin } = await import('@/lib/supabase/client');
        return await supabaseAdmin
          .from('purchases')
          .select('amount_usd')
          .eq('buyer_id', session.user.id)
          .eq('status', 'completed');
      });

      // Fetch user's subscription
      const subscriptionResult = await safeDbOperation(async () => {
        const { supabaseAdmin } = await import('@/lib/supabase/client');
        return await supabaseAdmin
          .from('subscriptions')
          .select('status')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();
      });

      // If all operations failed, use demo data
      if (!hotkeysResult.success && !purchasesResult.success && !subscriptionResult.success) {
        setStats({
          totalHotkeys: 3,
          totalSales: 12,
          totalRevenue: 142.50,
          activeSubscription: true,
        });
        setStatsError('Database unavailable. Showing demo data.');
        return;
      }

      const totalRevenue = purchasesResult.success
        ? purchasesResult.data?.reduce((sum, p) => sum + (p.amount_usd || 0), 0) || 0
        : 0;

      setStats({
        totalHotkeys: hotkeysResult.success ? (hotkeysResult.data?.length || 0) : 0,
        totalSales: purchasesResult.success ? (purchasesResult.data?.length || 0) : 0,
        totalRevenue,
        activeSubscription: subscriptionResult.success ? !!subscriptionResult.data : false,
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      setStatsError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setStatsLoading(false);
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-text-dim">Welcome back, {session?.user?.name || session?.user?.email}</p>
          {statsError && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">⚠️ {statsError}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h3 className="text-text-dim text-sm mb-2">My Hotkeys</h3>
            {statsLoading ? (
              <div className="text-2xl text-text-dim">Loading...</div>
            ) : (
              <p className="text-3xl font-bold">{stats.totalHotkeys}</p>
            )}
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h3 className="text-text-dim text-sm mb-2">Total Sales</h3>
            {statsLoading ? (
              <div className="text-2xl text-text-dim">Loading...</div>
            ) : (
              <p className="text-3xl font-bold">{stats.totalSales}</p>
            )}
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h3 className="text-text-dim text-sm mb-2">Revenue</h3>
            {statsLoading ? (
              <div className="text-2xl text-text-dim">Loading...</div>
            ) : (
              <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
            )}
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h3 className="text-text-dim text-sm mb-2">Subscription</h3>
            {statsLoading ? (
              <div className="text-lg text-text-dim">Loading...</div>
            ) : (
              <p className="text-lg font-bold">
                {stats.activeSubscription ? (
                  <span className="text-accent">Active</span>
                ) : (
                  <span className="text-text-dim">Inactive</span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Link href="/dashboard/hotkeys" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-8 transition-all">
            <h2 className="text-xl font-bold mb-2">My Hotkeys</h2>
            <p className="text-text-dim">Create and manage your hotkeys</p>
          </Link>

          <Link href="/dashboard/purchases" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-8 transition-all">
            <h2 className="text-xl font-bold mb-2">My Purchases</h2>
            <p className="text-text-dim">View and download purchased hotkeys</p>
          </Link>

          <Link href="/dashboard/agent" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-8 transition-all">
            <h2 className="text-xl font-bold mb-2">AI Agent Settings</h2>
            <p className="text-text-dim">Configure AI agent access and API keys</p>
          </Link>

          <Link href="/dashboard/analytics" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-8 transition-all">
            <h2 className="text-xl font-bold mb-2">Analytics</h2>
            <p className="text-text-dim">View detailed sales and usage analytics</p>
          </Link>

          <Link href="/dashboard/subscription" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-8 transition-all">
            <h2 className="text-xl font-bold mb-2">Subscription</h2>
            <p className="text-text-dim">Manage your $2/month hosting plan</p>
          </Link>

          <Link href="/dashboard/settings" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-8 transition-all">
            <h2 className="text-xl font-bold mb-2">Settings</h2>
            <p className="text-text-dim">Update profile and preferences</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
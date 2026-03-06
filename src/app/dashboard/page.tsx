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
      // Fetch comprehensive user data with proper aggregations
      const [hotkeysResult, salesResult, purchasesResult, subscriptionResult] = await Promise.all([
        // User's hotkeys count
        safeDbOperation(async () => {
          const { supabaseAdmin } = await import('@/lib/supabase/client');
          return await supabaseAdmin
            .from('hotkeys')
            .select('id')
            .eq('creator_id', session.user.id);
        }),
        
        // Sales of user's hotkeys (if they're a creator)
        safeDbOperation(async () => {
          const { supabaseAdmin } = await import('@/lib/supabase/client');
          
          // First get user's hotkey IDs
          const { data: hotkeys } = await supabaseAdmin
            .from('hotkeys')
            .select('id')
            .eq('creator_id', session.user.id);
          
          if (!hotkeys?.length) {
            return { data: [], error: null };
          }
          
          const hotkeyIds = hotkeys.map(h => h.id);
          
          // Then get purchases of those hotkeys
          return await supabaseAdmin
            .from('purchases')
            .select('amount_usd')
            .in('hotkey_id', hotkeyIds)
            .eq('status', 'completed');
        }),
        
        // User's own purchases
        safeDbOperation(async () => {
          const { supabaseAdmin } = await import('@/lib/supabase/client');
          return await supabaseAdmin
            .from('purchases')
            .select('amount_usd')
            .eq('buyer_id', session.user.id)
            .eq('status', 'completed');
        }),
        
        // User's subscription status
        safeDbOperation(async () => {
          const { supabaseAdmin } = await import('@/lib/supabase/client');
          return await supabaseAdmin
            .from('subscriptions')
            .select('status')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .maybeSingle();
        })
      ]);

      // Check if we have any successful operations
      const hasData = hotkeysResult.success || salesResult.success || purchasesResult.success || subscriptionResult.success;
      
      if (!hasData) {
        throw new Error('All database operations failed');
      }

      // Calculate stats based on user role
      let totalRevenue = 0;
      let totalSales = 0;
      
      if (session.user.role === 'creator') {
        // For creators, show revenue from their hotkey sales
        totalRevenue = salesResult.success
          ? salesResult.data?.reduce((sum, p) => sum + (p.amount_usd || 0), 0) || 0
          : 0;
        totalSales = salesResult.success ? (salesResult.data?.length || 0) : 0;
      } else {
        // For regular users, show their purchase history
        totalRevenue = purchasesResult.success
          ? purchasesResult.data?.reduce((sum, p) => sum + (p.amount_usd || 0), 0) || 0
          : 0;
        totalSales = purchasesResult.success ? (purchasesResult.data?.length || 0) : 0;
      }

      setStats({
        totalHotkeys: hotkeysResult.success ? (hotkeysResult.data?.length || 0) : 0,
        totalSales,
        totalRevenue,
        activeSubscription: subscriptionResult.success && !!subscriptionResult.data,
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      setStatsError('Failed to load dashboard data. Please check your connection and try again.');
      
      // Set stats to zero instead of showing fake data
      setStats({
        totalHotkeys: 0,
        totalSales: 0,
        totalRevenue: 0,
        activeSubscription: false,
      });
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
            <h3 className="text-text-dim text-sm mb-2">
              {session?.user?.role === 'creator' ? 'Total Sales' : 'Purchases Made'}
            </h3>
            {statsLoading ? (
              <div className="text-2xl text-text-dim">Loading...</div>
            ) : (
              <p className="text-3xl font-bold">{stats.totalSales}</p>
            )}
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h3 className="text-text-dim text-sm mb-2">
              {session?.user?.role === 'creator' ? 'Revenue Earned' : 'Total Spent'}
            </h3>
            {statsLoading ? (
              <div className="text-2xl text-text-dim">Loading...</div>
            ) : (
              <p className="text-3xl font-bold text-accent">${stats.totalRevenue.toFixed(2)}</p>
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

        {/* Role-specific dashboard sections */}
        {session?.user?.role === 'creator' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Creator Dashboard</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/hotkeys" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-6 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg">⚡</span>
                    </div>
                    <h3 className="text-lg font-bold">My Hotkeys</h3>
                  </div>
                  <p className="text-text-dim text-sm">Create and manage your hotkey packs</p>
                </Link>

                <Link href="/dashboard/revenue" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-6 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg">💰</span>
                    </div>
                    <h3 className="text-lg font-bold">Revenue</h3>
                  </div>
                  <p className="text-text-dim text-sm">Track earnings and payouts</p>
                </Link>

                <Link href="/dashboard/analytics" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-6 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📊</span>
                    </div>
                    <h3 className="text-lg font-bold">Analytics</h3>
                  </div>
                  <p className="text-text-dim text-sm">Sales and usage insights</p>
                </Link>
              </div>
            </div>
          </>
        )}

        {session?.user?.role === 'ai_agent' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">AI Agent Dashboard</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/api-keys" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-6 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🔑</span>
                    </div>
                    <h3 className="text-lg font-bold">API Keys</h3>
                  </div>
                  <p className="text-text-dim text-sm">Manage authentication tokens</p>
                </Link>

                <Link href="/dashboard/bulk-licenses" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-6 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg">⚡</span>
                    </div>
                    <h3 className="text-lg font-bold">Bulk Licensing</h3>
                  </div>
                  <p className="text-text-dim text-sm">Generate licenses programmatically</p>
                </Link>

                <Link href="/dashboard/usage" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-6 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📈</span>
                    </div>
                    <h3 className="text-lg font-bold">Usage Analytics</h3>
                  </div>
                  <p className="text-text-dim text-sm">API calls and performance metrics</p>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* General user dashboard */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {session?.user?.role === 'creator' ? 'Additional Tools' : session?.user?.role === 'ai_agent' ? 'Additional Features' : 'My Dashboard'}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/purchases" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-6 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🛒</span>
                </div>
                <h3 className="text-lg font-bold">My Purchases</h3>
              </div>
              <p className="text-text-dim text-sm">View and download purchased hotkeys</p>
            </Link>

            <Link href="/dashboard/installation" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-6 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⚙️</span>
                </div>
                <h3 className="text-lg font-bold">Installation Hub</h3>
              </div>
              <p className="text-text-dim text-sm">Install hotkeys across editors</p>
            </Link>

            <Link href="/dashboard/settings" className="bg-bg-card border-2 border-border hover:border-accent rounded-xl p-6 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⚙️</span>
                </div>
                <h3 className="text-lg font-bold">Settings</h3>
              </div>
              <p className="text-text-dim text-sm">Update profile and preferences</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase/client';
import { LoadingWrapper, EmptyState } from '@/components/ui/LoadingStates';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueStats {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  topSellingHotkey: {
    title: string;
    revenue: number;
    sales: number;
  } | null;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    sales: number;
  }>;
  payoutHistory: Array<{
    id: string;
    amount: number;
    status: string;
    created_at: string;
  }>;
}

export default function RevenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    totalSales: 0,
    averageOrderValue: 0,
    topSellingHotkey: null,
    monthlyRevenue: [],
    payoutHistory: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id && session.user.role === 'creator') {
      fetchRevenueStats();
    }
  }, [session]);

  async function fetchRevenueStats() {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Get all hotkeys by this creator
      const { data: hotkeys, error: hotkeysError } = await supabaseAdmin
        .from('hotkeys')
        .select('id, title')
        .eq('creator_id', session.user.id);

      if (hotkeysError) throw hotkeysError;
      
      const hotkeyIds = hotkeys?.map(h => h.id) || [];
      
      if (hotkeyIds.length === 0) {
        setStats({
          totalRevenue: 0,
          totalSales: 0,
          averageOrderValue: 0,
          topSellingHotkey: null,
          monthlyRevenue: [],
          payoutHistory: []
        });
        return;
      }

      // Get all purchases for creator's hotkeys
      const { data: purchases, error: purchasesError } = await supabaseAdmin
        .from('purchases')
        .select('id, hotkey_id, amount_usd, created_at, status')
        .in('hotkey_id', hotkeyIds)
        .eq('status', 'completed');

      if (purchasesError) throw purchasesError;

      // Calculate total revenue and sales
      const totalRevenue = purchases?.reduce((sum, p) => sum + (p.amount_usd || 0), 0) || 0;
      const totalSales = purchases?.length || 0;
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Find top selling hotkey
      const salesByHotkey = purchases?.reduce((acc, p) => {
        if (!acc[p.hotkey_id]) {
          acc[p.hotkey_id] = { revenue: 0, sales: 0 };
        }
        acc[p.hotkey_id].revenue += p.amount_usd || 0;
        acc[p.hotkey_id].sales += 1;
        return acc;
      }, {} as Record<string, { revenue: number; sales: number }>);

      let topSellingHotkey = null;
      if (salesByHotkey) {
        const topHotkeyId = Object.entries(salesByHotkey)
          .sort(([, a], [, b]) => b.revenue - a.revenue)[0]?.[0];
        
        if (topHotkeyId) {
          const hotkey = hotkeys?.find(h => h.id === topHotkeyId);
          topSellingHotkey = {
            title: hotkey?.title || 'Unknown',
            revenue: salesByHotkey[topHotkeyId].revenue,
            sales: salesByHotkey[topHotkeyId].sales
          };
        }
      }

      // Calculate monthly revenue
      const monthlyData = purchases?.reduce((acc, p) => {
        const date = new Date(p.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { revenue: 0, sales: 0 };
        }
        acc[monthKey].revenue += p.amount_usd || 0;
        acc[monthKey].sales += 1;
        return acc;
      }, {} as Record<string, { revenue: number; sales: number }>);

      const monthlyRevenue = Object.entries(monthlyData || {})
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Last 6 months

      // Get payout history
      const { data: payouts } = await supabaseAdmin
        .from('payouts')
        .select('id, amount_usd, status, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalRevenue,
        totalSales,
        averageOrderValue,
        topSellingHotkey,
        monthlyRevenue,
        payoutHistory: payouts?.map(p => ({
          id: p.id,
          amount: p.amount_usd,
          status: p.status,
          created_at: p.created_at
        })) || []
      });

    } catch (err: any) {
      console.error('Failed to fetch revenue stats:', err);
      setError(err?.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }

  const chartData = {
    labels: stats.monthlyRevenue.map(m => {
      const [year, month] = m.month.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('default', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Revenue',
        data: stats.monthlyRevenue.map(m => m.revenue),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `$${value}`
        }
      }
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (session?.user?.role !== 'creator') {
    return (
      <main className="min-h-screen py-24">
        <div className="max-w-7xl mx-auto px-6">
          <EmptyState
            icon="🔒"
            title="Creator Access Required"
            description="This page is only available for creators"
            action={{
              label: "Go to Dashboard",
              onClick: () => router.push('/dashboard')
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Revenue Analytics</h1>
          <p className="text-text-dim">Track your earnings and payouts</p>
        </div>

        <LoadingWrapper
          loading={loading}
          error={error}
          onRetry={fetchRevenueStats}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-text-dim text-sm mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-accent">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-text-dim text-sm mb-2">Total Sales</h3>
              <p className="text-3xl font-bold">{stats.totalSales}</p>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-text-dim text-sm mb-2">Avg Order Value</h3>
              <p className="text-3xl font-bold">${stats.averageOrderValue.toFixed(2)}</p>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-text-dim text-sm mb-2">Top Seller</h3>
              <p className="text-lg font-bold truncate">{stats.topSellingHotkey?.title || 'N/A'}</p>
              {stats.topSellingHotkey && (
                <p className="text-sm text-text-dim">${stats.topSellingHotkey.revenue.toFixed(2)}</p>
              )}
            </div>
          </div>

          {stats.monthlyRevenue.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">Monthly Revenue Trend</h3>
              <div style={{ height: '300px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Payout History</h3>
            {stats.payoutHistory.length === 0 ? (
              <p className="text-text-dim">No payouts yet</p>
            ) : (
              <div className="space-y-3">
                {stats.payoutHistory.map(payout => (
                  <div key={payout.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                    <div>
                      <p className="font-medium">${payout.amount.toFixed(2)}</p>
                      <p className="text-sm text-text-dim">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payout.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400'
                        : payout.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {payout.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </LoadingWrapper>
      </div>
    </main>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase/client';
import { LoadingWrapper, EmptyState } from '@/components/ui/LoadingStates';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalDownloads: number;
    totalRevenue: number;
    conversionRate: number;
  };
  timeSeriesData: Array<{
    date: string;
    views: number;
    downloads: number;
    revenue: number;
  }>;
  hotkeyPerformance: Array<{
    id: string;
    title: string;
    views: number;
    downloads: number;
    revenue: number;
    conversionRate: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    downloads: number;
    revenue: number;
  }>;
  geographicData: Array<{
    country: string;
    downloads: number;
  }>;
  installationBreakdown: Array<{
    editor: string;
    count: number;
  }>;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    overview: { totalViews: 0, totalDownloads: 0, totalRevenue: 0, conversionRate: 0 },
    timeSeriesData: [],
    hotkeyPerformance: [],
    categoryBreakdown: [],
    geographicData: [],
    installationBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id && session.user.role === 'creator') {
      fetchAnalytics();
    }
  }, [session, timeRange]);

  async function fetchAnalytics() {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Get all hotkeys by this creator
      const { data: hotkeys, error: hotkeysError } = await supabaseAdmin
        .from('hotkeys')
        .select('id, title, category')
        .eq('creator_id', session.user.id);

      if (hotkeysError) throw hotkeysError;
      
      const hotkeyIds = hotkeys?.map(h => h.id) || [];
      
      if (hotkeyIds.length === 0) {
        setAnalytics({
          overview: { totalViews: 0, totalDownloads: 0, totalRevenue: 0, conversionRate: 0 },
          timeSeriesData: [],
          hotkeyPerformance: [],
          categoryBreakdown: [],
          geographicData: [],
          installationBreakdown: []
        });
        return;
      }

      // Fetch analytics data in parallel
      const [
        purchasesData,
        viewsData,
        downloadsData,
        installationsData
      ] = await Promise.all([
        // Purchases
        supabaseAdmin
          .from('purchases')
          .select('hotkey_id, amount_usd, created_at')
          .in('hotkey_id', hotkeyIds)
          .eq('status', 'completed')
          .gte('created_at', startDate.toISOString()),
        
        // Views (hotkey page visits)
        supabaseAdmin
          .from('analytics_events')
          .select('hotkey_id, created_at')
          .in('hotkey_id', hotkeyIds)
          .eq('event_type', 'view')
          .gte('created_at', startDate.toISOString()),
        
        // Downloads
        supabaseAdmin
          .from('downloads')
          .select('hotkey_id, created_at')
          .in('hotkey_id', hotkeyIds)
          .gte('created_at', startDate.toISOString()),
        
        // Installations
        supabaseAdmin
          .from('installation_events')
          .select('hotkey_id, editor, created_at')
          .in('hotkey_id', hotkeyIds)
          .eq('event_type', 'install_completed')
          .gte('created_at', startDate.toISOString())
      ]);

      if (purchasesData.error || viewsData.error || downloadsData.error || installationsData.error) {
        throw new Error('Failed to fetch analytics data');
      }

      // Process data
      const purchases = purchasesData.data || [];
      const views = viewsData.data || [];
      const downloads = downloadsData.data || [];
      const installations = installationsData.data || [];

      // Calculate overview metrics
      const totalViews = views.length;
      const totalDownloads = downloads.length;
      const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount_usd || 0), 0);
      const conversionRate = totalViews > 0 ? (purchases.length / totalViews) * 100 : 0;

      // Generate time series data
      const timeSeriesData = [];
      const dayMs = 24 * 60 * 60 * 1000;
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * dayMs);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayViews = views.filter(v => v.created_at.startsWith(dateStr)).length;
        const dayDownloads = downloads.filter(d => d.created_at.startsWith(dateStr)).length;
        const dayRevenue = purchases
          .filter(p => p.created_at.startsWith(dateStr))
          .reduce((sum, p) => sum + (p.amount_usd || 0), 0);
        
        timeSeriesData.push({
          date: dateStr,
          views: dayViews,
          downloads: dayDownloads,
          revenue: dayRevenue
        });
      }

      // Calculate hotkey performance
      const hotkeyPerformance = (hotkeys || []).map(hotkey => {
        const hotkeyViews = views.filter(v => v.hotkey_id === hotkey.id).length;
        const hotkeyDownloads = downloads.filter(d => d.hotkey_id === hotkey.id).length;
        const hotkeyRevenue = purchases
          .filter(p => p.hotkey_id === hotkey.id)
          .reduce((sum, p) => sum + (p.amount_usd || 0), 0);
        const hotkeyConversionRate = hotkeyViews > 0 ? (purchases.filter(p => p.hotkey_id === hotkey.id).length / hotkeyViews) * 100 : 0;

        return {
          id: hotkey.id,
          title: hotkey.title,
          views: hotkeyViews,
          downloads: hotkeyDownloads,
          revenue: hotkeyRevenue,
          conversionRate: hotkeyConversionRate
        };
      }).sort((a, b) => b.revenue - a.revenue);

      // Category breakdown
      const categoryMap = new Map<string, { downloads: number; revenue: number }>();
      (hotkeys || []).forEach(hotkey => {
        const category = hotkey.category;
        const hotkeyDownloads = downloads.filter(d => d.hotkey_id === hotkey.id).length;
        const hotkeyRevenue = purchases
          .filter(p => p.hotkey_id === hotkey.id)
          .reduce((sum, p) => sum + (p.amount_usd || 0), 0);

        const existing = categoryMap.get(category) || { downloads: 0, revenue: 0 };
        categoryMap.set(category, {
          downloads: existing.downloads + hotkeyDownloads,
          revenue: existing.revenue + hotkeyRevenue
        });
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        ...data
      }));

      // Installation breakdown by editor
      const editorMap = new Map<string, number>();
      installations.forEach(inst => {
        editorMap.set(inst.editor, (editorMap.get(inst.editor) || 0) + 1);
      });

      const installationBreakdown = Array.from(editorMap.entries()).map(([editor, count]) => ({
        editor,
        count
      }));

      setAnalytics({
        overview: {
          totalViews,
          totalDownloads,
          totalRevenue,
          conversionRate
        },
        timeSeriesData,
        hotkeyPerformance,
        categoryBreakdown,
        geographicData: [], // TODO: Implement geographic tracking
        installationBreakdown
      });

    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  // Chart configurations
  const timeSeriesChartData = {
    labels: analytics.timeSeriesData.map(d => new Date(d.date).toLocaleDateString('default', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Views',
        data: analytics.timeSeriesData.map(d => d.views),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Downloads',
        data: analytics.timeSeriesData.map(d => d.downloads),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const categoryChartData = {
    labels: analytics.categoryBreakdown.map(c => c.category),
    datasets: [{
      data: analytics.categoryBreakdown.map(c => c.downloads),
      backgroundColor: [
        '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', 
        '#EF4444', '#6366F1', '#EC4899', '#84CC16'
      ],
      borderWidth: 0
    }]
  };

  const installationChartData = {
    labels: analytics.installationBreakdown.map(i => i.editor),
    datasets: [{
      label: 'Installations',
      data: analytics.installationBreakdown.map(i => i.count),
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
      borderColor: 'rgba(139, 92, 246, 1)',
      borderWidth: 1
    }]
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics</h1>
            <p className="text-text-dim">Track your hotkey performance and user engagement</p>
          </div>
          
          <div className="flex gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-accent text-bg'
                    : 'bg-bg-card border border-border hover:border-accent'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        <LoadingWrapper
          loading={loading}
          error={error}
          onRetry={fetchAnalytics}
        >
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-text-dim text-sm mb-2">Total Views</h3>
              <p className="text-3xl font-bold text-blue-400">{analytics.overview.totalViews.toLocaleString()}</p>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-text-dim text-sm mb-2">Total Downloads</h3>
              <p className="text-3xl font-bold text-green-400">{analytics.overview.totalDownloads.toLocaleString()}</p>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-text-dim text-sm mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-accent">${analytics.overview.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-text-dim text-sm mb-2">Conversion Rate</h3>
              <p className="text-3xl font-bold">{analytics.overview.conversionRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Time Series Chart */}
          {analytics.timeSeriesData.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">Views & Downloads Over Time</h3>
              <div style={{ height: '300px' }}>
                <Line 
                  data={timeSeriesChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true } },
                    scales: { y: { beginAtZero: true } }
                  }} 
                />
              </div>
            </div>
          )}

          {/* Performance Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Performing Hotkeys */}
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Top Performing Hotkeys</h3>
              {analytics.hotkeyPerformance.length === 0 ? (
                <p className="text-text-dim">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics.hotkeyPerformance.slice(0, 5).map((hotkey) => (
                    <div key={hotkey.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">{hotkey.title}</p>
                        <p className="text-sm text-text-dim">
                          {hotkey.views} views • {hotkey.downloads} downloads
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${hotkey.revenue.toFixed(2)}</p>
                        <p className="text-sm text-text-dim">{hotkey.conversionRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Downloads by Category</h3>
              {analytics.categoryBreakdown.length === 0 ? (
                <p className="text-text-dim">No data yet</p>
              ) : (
                <>
                  <div style={{ height: '200px' }} className="mb-4">
                    <Doughnut 
                      data={categoryChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } }
                      }} 
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Installation Breakdown */}
          {analytics.installationBreakdown.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Installations by Editor</h3>
              <div style={{ height: '300px' }}>
                <Bar 
                  data={installationChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                  }} 
                />
              </div>
            </div>
          )}
        </LoadingWrapper>
      </div>
    </main>
  );
}
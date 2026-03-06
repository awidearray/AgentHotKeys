'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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
  Filler,
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

interface UsageStats {
  current_period: {
    api_calls: number;
    licenses_generated: number;
    bandwidth_used: number; // in GB
    start_date: string;
    end_date: string;
  };
  limits: {
    api_calls: number;
    licenses_per_month: number;
    bandwidth_gb: number;
  };
  plan: {
    name: string;
    tier: 'free' | 'pro' | 'enterprise';
  };
  usage_history: {
    date: string;
    api_calls: number;
    licenses_generated: number;
    bandwidth_mb: number;
  }[];
  recent_api_calls: {
    timestamp: string;
    endpoint: string;
    method: string;
    status_code: number;
    response_time_ms: number;
    user_agent?: string;
  }[];
}

interface QuotaWarning {
  type: 'api_calls' | 'licenses' | 'bandwidth';
  current: number;
  limit: number;
  percentage: number;
  message: string;
}

export default function UsagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [quotaWarnings, setQuotaWarnings] = useState<QuotaWarning[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (session.user.role !== 'ai_agent' && session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchUsageStats();
  }, [session, status, router, timeRange]);

  const fetchUsageStats = async () => {
    try {
      const response = await fetch(`/api/ai-agent/analytics?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage statistics');
      }
      const data = await response.json();
      setUsageStats(data);
      
      // Check for quota warnings
      const warnings: QuotaWarning[] = [];
      const { current_period, limits } = data;
      
      const apiCallsPercentage = (current_period.api_calls / limits.api_calls) * 100;
      const licensesPercentage = (current_period.licenses_generated / limits.licenses_per_month) * 100;
      const bandwidthPercentage = (current_period.bandwidth_used / limits.bandwidth_gb) * 100;
      
      if (apiCallsPercentage >= 80) {
        warnings.push({
          type: 'api_calls',
          current: current_period.api_calls,
          limit: limits.api_calls,
          percentage: apiCallsPercentage,
          message: `You've used ${apiCallsPercentage.toFixed(1)}% of your API calls this month.`
        });
      }
      
      if (licensesPercentage >= 80) {
        warnings.push({
          type: 'licenses',
          current: current_period.licenses_generated,
          limit: limits.licenses_per_month,
          percentage: licensesPercentage,
          message: `You've generated ${licensesPercentage.toFixed(1)}% of your monthly license quota.`
        });
      }
      
      if (bandwidthPercentage >= 80) {
        warnings.push({
          type: 'bandwidth',
          current: current_period.bandwidth_used,
          limit: limits.bandwidth_gb,
          percentage: bandwidthPercentage,
          message: `You've used ${bandwidthPercentage.toFixed(1)}% of your bandwidth allowance.`
        });
      }
      
      setQuotaWarnings(warnings);
      
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      setError('Failed to load usage statistics');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-accent';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Chart configurations
  const usageChartData = usageStats ? {
    labels: usageStats.usage_history.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'API Calls',
        data: usageStats.usage_history.map(item => item.api_calls),
        borderColor: '#00E5A0',
        backgroundColor: 'rgba(0, 229, 160, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Licenses Generated',
        data: usageStats.usage_history.map(item => item.licenses_generated),
        borderColor: '#60A5FA',
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  } : { labels: [], datasets: [] };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#A1A1AA',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#A1A1AA',
        },
        grid: {
          color: 'rgba(161, 161, 170, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#A1A1AA',
        },
        grid: {
          color: 'rgba(161, 161, 170, 0.1)',
        },
      },
    },
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-dim">Loading usage statistics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!usageStats) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-text-dim">No usage data available</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">API Usage & Analytics</h1>
            <p className="text-text-dim">Monitor your API usage, track quotas, and analyze performance</p>
          </div>
          
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-bg border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {quotaWarnings.length > 0 && (
          <div className="space-y-3 mb-8">
            {quotaWarnings.map((warning, index) => (
              <div key={index} className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-yellow-400">Quota Warning</p>
                    <p className="text-text-dim text-sm mt-1">{warning.message}</p>
                  </div>
                  <Button variant="secondary" href="/dashboard/settings" className="text-sm">
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current Plan & Usage Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-text-dim">Current Plan</h3>
              <Badge variant="secondary" className="capitalize">
                {usageStats.plan.name}
              </Badge>
            </div>
            <p className="text-2xl font-bold capitalize">{usageStats.plan.tier}</p>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h3 className="font-medium text-text-dim mb-3">API Calls</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold">{usageStats.current_period.api_calls.toLocaleString()}</span>
              <span className="text-text-dim text-sm">of {usageStats.limits.api_calls.toLocaleString()}</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getProgressBarColor(getUsagePercentage(usageStats.current_period.api_calls, usageStats.limits.api_calls))}`}
                style={{ width: `${getUsagePercentage(usageStats.current_period.api_calls, usageStats.limits.api_calls)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h3 className="font-medium text-text-dim mb-3">Licenses Generated</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold">{usageStats.current_period.licenses_generated}</span>
              <span className="text-text-dim text-sm">of {usageStats.limits.licenses_per_month}</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getProgressBarColor(getUsagePercentage(usageStats.current_period.licenses_generated, usageStats.limits.licenses_per_month))}`}
                style={{ width: `${getUsagePercentage(usageStats.current_period.licenses_generated, usageStats.limits.licenses_per_month)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h3 className="font-medium text-text-dim mb-3">Bandwidth Used</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold">{usageStats.current_period.bandwidth_used.toFixed(1)}GB</span>
              <span className="text-text-dim text-sm">of {usageStats.limits.bandwidth_gb}GB</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getProgressBarColor(getUsagePercentage(usageStats.current_period.bandwidth_used, usageStats.limits.bandwidth_gb))}`}
                style={{ width: `${getUsagePercentage(usageStats.current_period.bandwidth_used, usageStats.limits.bandwidth_gb)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Usage Chart */}
        <div className="bg-bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Usage Trends</h2>
          <div className="h-80">
            <Line data={usageChartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent API Calls */}
        <div className="bg-bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6">Recent API Calls</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-3 font-medium text-text-dim">Timestamp</th>
                  <th className="pb-3 font-medium text-text-dim">Endpoint</th>
                  <th className="pb-3 font-medium text-text-dim">Method</th>
                  <th className="pb-3 font-medium text-text-dim">Status</th>
                  <th className="pb-3 font-medium text-text-dim">Response Time</th>
                </tr>
              </thead>
              <tbody>
                {usageStats.recent_api_calls.slice(0, 10).map((call, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-3 text-sm">
                      {new Date(call.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 text-sm font-mono">
                      {call.endpoint}
                    </td>
                    <td className="py-3">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          call.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                          call.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                          call.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                          call.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {call.method}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${
                          call.status_code >= 200 && call.status_code < 300 ? 'bg-green-500/20 text-green-400' :
                          call.status_code >= 400 ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {call.status_code}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm">
                      {call.response_time_ms}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {usageStats.recent_api_calls.length === 0 && (
            <div className="text-center py-8">
              <p className="text-text-dim">No recent API calls</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
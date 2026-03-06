'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface BulkLicense {
  id: string;
  created_at: string;
  total_licenses: number;
  licenses_generated: number;
  tier: 'basic' | 'pro' | 'enterprise';
  discount_percentage: number;
  cost_per_license: number;
  total_cost: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_licenses: License[];
}

interface License {
  id: string;
  license_key: string;
  status: 'active' | 'used' | 'expired';
  assigned_to?: string;
  created_at: string;
  expires_at?: string;
}

export default function BulkLicensesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bulkLicenses, setBulkLicenses] = useState<BulkLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    totalLicenses: 10,
    tier: 'pro' as 'basic' | 'pro' | 'enterprise',
    discountPercentage: 0
  });

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
    
    fetchBulkLicenses();
  }, [session, status, router]);

  const fetchBulkLicenses = async () => {
    try {
      const response = await fetch('/api/ai-agent/bulk-licenses');
      if (!response.ok) {
        throw new Error('Failed to fetch bulk licenses');
      }
      const data = await response.json();
      setBulkLicenses(data.bulk_licenses || []);
    } catch (error) {
      console.error('Error fetching bulk licenses:', error);
      setError('Failed to load bulk licenses');
    } finally {
      setLoading(false);
    }
  };

  const generateBulkLicenses = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai-agent/bulk-licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_licenses: formData.totalLicenses,
          tier: formData.tier,
          discount_percentage: formData.discountPercentage
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate bulk licenses');
      }

      const newBulkLicense = await response.json();
      setBulkLicenses(prev => [newBulkLicense, ...prev]);
      setShowNewForm(false);
      
      // Reset form
      setFormData({
        totalLicenses: 10,
        tier: 'pro',
        discountPercentage: 0
      });
    } catch (error) {
      console.error('Error generating bulk licenses:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate licenses');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportLicenses = async (bulkLicenseId: string) => {
    try {
      const response = await fetch(`/api/ai-agent/bulk-licenses/${bulkLicenseId}/export`);
      if (!response.ok) {
        throw new Error('Failed to export licenses');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `bulk-licenses-${bulkLicenseId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting licenses:', error);
      setError('Failed to export licenses');
    }
  };

  const getTierPricing = (tier: string) => {
    switch (tier) {
      case 'basic': return 9.99;
      case 'pro': return 19.99;
      case 'enterprise': return 49.99;
      default: return 19.99;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'processing': return 'bg-yellow-500/20 text-yellow-400';
      case 'pending': return 'bg-blue-500/20 text-blue-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-dim">Loading bulk licenses...</p>
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
            <h1 className="text-3xl font-bold mb-2">Bulk Licenses</h1>
            <p className="text-text-dim">Generate and manage licenses in bulk for your AI agent deployment</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowNewForm(!showNewForm)}
            disabled={isGenerating}
          >
            Generate Bulk Licenses
          </Button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {showNewForm && (
          <div className="bg-bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">Generate New Bulk Licenses</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Number of Licenses</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.totalLicenses}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalLicenses: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">License Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value as any }))}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="basic">Basic ($9.99/license)</option>
                  <option value="pro">Pro ($19.99/license)</option>
                  <option value="enterprise">Enterprise ($49.99/license)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discount Percentage (Optional)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex items-end">
                <div className="bg-bg border border-border rounded-lg p-4 w-full">
                  <p className="text-sm text-text-dim mb-1">Total Cost</p>
                  <p className="text-2xl font-bold">
                    ${(
                      formData.totalLicenses * 
                      getTierPricing(formData.tier) * 
                      (1 - formData.discountPercentage / 100)
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                variant="primary"
                onClick={generateBulkLicenses}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Licenses'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowNewForm(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {bulkLicenses.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎫</span>
              </div>
              <h3 className="text-xl font-bold mb-2">No Bulk Licenses Yet</h3>
              <p className="text-text-dim mb-6">Generate your first batch of licenses to get started</p>
              <Button variant="primary" onClick={() => setShowNewForm(true)}>
                Generate Bulk Licenses
              </Button>
            </div>
          ) : (
            bulkLicenses.map((bulk) => (
              <div key={bulk.id} className="bg-bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">Bulk License #{bulk.id.slice(-8)}</h3>
                      <Badge variant="secondary" className={getStatusColor(bulk.status)}>
                        {bulk.status}
                      </Badge>
                    </div>
                    <p className="text-text-dim text-sm">
                      Created {new Date(bulk.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold">${bulk.total_cost}</p>
                    <p className="text-text-dim text-sm">
                      {bulk.licenses_generated} of {bulk.total_licenses} licenses
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-bg border border-border rounded-lg p-3">
                    <p className="text-text-dim text-xs mb-1">Tier</p>
                    <p className="font-bold capitalize">{bulk.tier}</p>
                  </div>
                  <div className="bg-bg border border-border rounded-lg p-3">
                    <p className="text-text-dim text-xs mb-1">Cost per License</p>
                    <p className="font-bold">${bulk.cost_per_license}</p>
                  </div>
                  <div className="bg-bg border border-border rounded-lg p-3">
                    <p className="text-text-dim text-xs mb-1">Discount</p>
                    <p className="font-bold">{bulk.discount_percentage}%</p>
                  </div>
                  <div className="bg-bg border border-border rounded-lg p-3">
                    <p className="text-text-dim text-xs mb-1">Progress</p>
                    <div className="w-full bg-border rounded-full h-2 mt-1">
                      <div 
                        className="bg-accent h-2 rounded-full" 
                        style={{ width: `${(bulk.licenses_generated / bulk.total_licenses) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {bulk.status === 'completed' && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => exportLicenses(bulk.id)}
                      className="text-sm"
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {/* View individual licenses logic */}}
                      className="text-sm"
                    >
                      View Licenses ({bulk.generated_licenses.length})
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
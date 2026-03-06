'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase/client';
import Link from 'next/link';
import { LoadingWrapper, EmptyState } from '@/components/ui/LoadingStates';

interface Purchase {
  id: string;
  hotkey_id: string;
  amount_usd: number;
  payment_method: string;
  status: string;
  created_at: string;
  hotkey: {
    id: string;
    title: string;
    description: string;
    category: string;
    content: any;
    creator: {
      name: string;
      email: string;
    };
  };
}

export default function PurchasesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPurchases();
    }
  }, [session]);

  async function fetchPurchases() {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabaseAdmin
        .from('purchases')
        .select(`
          id,
          hotkey_id,
          amount_usd,
          payment_method,
          status,
          created_at,
          hotkey:hotkeys(
            id,
            title,
            description,
            category,
            content,
            creator:users(name, email)
          )
        `)
        .eq('buyer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (dbError) {
        throw dbError;
      }

      const normalized = (data || []).map((row: any) => {
        const hotkey = Array.isArray(row.hotkey) ? row.hotkey[0] : row.hotkey;
        return {
          ...row,
          hotkey: {
            ...hotkey,
            creator: Array.isArray(hotkey?.creator) ? hotkey.creator[0] : hotkey?.creator,
          },
        };
      });

      setPurchases(normalized);
    } catch (err: any) {
      console.error('Failed to fetch purchases:', err);
      setError(err?.message || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }

  async function downloadHotkey(purchase: Purchase) {
    if (purchase.status !== 'completed') {
      alert('Purchase not completed. Cannot download.');
      return;
    }

    try {
      const content = purchase.hotkey.content;
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${purchase.hotkey.title.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Track download
      await supabaseAdmin
        .from('downloads')
        .insert({
          user_id: session?.user?.id,
          hotkey_id: purchase.hotkey_id,
          purchase_id: purchase.id
        });

    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download hotkey. Please try again.');
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Purchases</h1>
          <p className="text-text-dim">Download and manage your purchased hotkeys</p>
        </div>

        <LoadingWrapper
          loading={loading}
          error={error}
          onRetry={fetchPurchases}
        >
          {purchases.length === 0 ? (
            <EmptyState
              icon="🛒"
              title="No Purchases Yet"
              description="Browse the marketplace to find hotkeys that boost your productivity"
              action={{
                label: "Browse Marketplace",
                onClick: () => router.push('/marketplace')
              }}
            />
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="bg-bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{purchase.hotkey.title}</h3>
                      <p className="text-text-dim mb-3">{purchase.hotkey.description}</p>
                      <div className="flex items-center gap-4 text-sm text-text-dim">
                        <span>Category: {purchase.hotkey.category}</span>
                        <span>By: {purchase.hotkey.creator?.name || 'Unknown'}</span>
                        <span>Purchased: {new Date(purchase.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold mb-2">${purchase.amount_usd}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        purchase.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400' 
                          : purchase.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {purchase.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadHotkey(purchase)}
                      disabled={purchase.status !== 'completed'}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        purchase.status === 'completed'
                          ? 'bg-accent text-bg hover:bg-accent-bright'
                          : 'bg-bg-card border border-border text-text-dim cursor-not-allowed'
                      }`}
                    >
                      Download Hotkey
                    </button>
                    <Link
                      href={`/dashboard/installation?hotkey=${purchase.hotkey_id}`}
                      className="px-6 py-2 bg-bg border border-border rounded-lg hover:border-accent transition-all"
                    >
                      Installation Guide
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </LoadingWrapper>
      </div>
    </main>
  );
}
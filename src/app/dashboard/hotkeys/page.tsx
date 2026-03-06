'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { safeDbOperation } from '@/lib/supabase/client';
import Link from 'next/link';
import { LoadingWrapper, CardSkeleton, EmptyState } from '@/components/ui/LoadingStates';

interface Hotkey {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price_usd: number;
  is_free: boolean;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  downloads: number;
  rating_average: number;
  rating_count: number;
  created_at: string;
}

export default function MyHotkeysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hotkeys, setHotkeys] = useState<Hotkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchHotkeys();
    }
  }, [session]);

  async function fetchHotkeys() {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await safeDbOperation(async () => {
        const { supabaseAdmin } = await import('@/lib/supabase/client');
        return await supabaseAdmin
          .from('hotkeys')
          .select(`
            id,
            title,
            description,
            category,
            tags,
            price_usd,
            is_free,
            status,
            downloads,
            rating_average,
            rating_count,
            created_at
          `)
          .eq('creator_id', session.user.id)
          .order('created_at', { ascending: false });
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch hotkeys');
      }

      setHotkeys(result.data || []);
    } catch (error) {
      console.error('Fetch hotkeys error:', error);
      setError('Failed to load your hotkeys. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-400';
      case 'pending_review': return 'text-yellow-400';
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'archived': return 'text-gray-500';
      default: return 'text-text-dim';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'pending_review': return 'Under Review';
      case 'approved': return 'Live';
      case 'rejected': return 'Rejected';
      case 'archived': return 'Archived';
      default: return status;
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Hotkeys</h1>
            <p className="text-text-dim">Create and manage your coding hotkeys</p>
          </div>
          <Link
            href="/dashboard/hotkeys/new"
            className="px-6 py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent-bright transition-all"
          >
            Create New Hotkey
          </Link>
        </div>

        <LoadingWrapper
          loading={loading}
          error={error}
          onRetry={() => fetchHotkeys()}
          skeleton={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          }
        >
          {hotkeys.length === 0 && !error ? (
            <EmptyState
              icon="🚀"
              title="No Hotkeys Yet"
              description="Create your first hotkey to share with the community and start earning!"
              action={{
                label: "Create Your First Hotkey",
                onClick: () => router.push("/dashboard/hotkeys/new")
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotkeys.map((hotkey) => (
                <div
                  key={hotkey.id}
                  className="bg-bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{hotkey.title}</h3>
                      <span className={`text-sm font-medium ${getStatusColor(hotkey.status)}`}>
                        {getStatusLabel(hotkey.status)}
                      </span>
                    </div>
                    <div className="text-right">
                      {hotkey.is_free ? (
                        <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-bold">
                          FREE
                        </span>
                      ) : (
                        <span className="text-lg font-bold">${hotkey.price_usd}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-text-dim mb-4 text-sm line-clamp-2">
                    {hotkey.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotkey.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-bg text-text-dim rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-text-dim mb-4">
                    <span>⭐ {hotkey.rating_average?.toFixed(1) || '0.0'}</span>
                    <span>{hotkey.downloads} downloads</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/hotkeys/${hotkey.id}/edit`}
                      className="flex-1 py-2 px-4 bg-bg border border-border rounded-lg text-center hover:border-accent transition-all text-sm font-medium"
                    >
                      Edit
                    </Link>
                    {hotkey.status === 'approved' && (
                      <Link
                        href={`/marketplace/${hotkey.id}`}
                        className="flex-1 py-2 px-4 bg-accent text-bg rounded-lg text-center hover:bg-accent-bright transition-all text-sm font-medium"
                      >
                        View Live
                      </Link>
                    )}
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
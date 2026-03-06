'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LoadingWrapper, CardSkeleton, EmptyState } from '@/components/ui/LoadingStates';
import { ApiError } from '@/components/ui/ErrorBoundary';

interface Hotkey {
  id: string;
  title: string;
  description: string;
  price_usd: number;
  price_crypto: any;
  is_free: boolean;
  category: string;
  tags: string[];
  rating_average: number;
  rating_count: number;
  downloads: number;
  creator: {
    name: string;
    avatar_url: string;
  };
}

export default function MarketplacePage() {
  const [hotkeys, setHotkeys] = useState<Hotkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHotkeys();
  }, [selectedCategory, searchTerm]);

  const [demoMode, setDemoMode] = useState(false);

  async function fetchHotkeys() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/hotkeys?${new URLSearchParams({
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm }),
      })}`);
      
      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          setError(`Service temporarily unavailable: ${errorData.message}`);
        } else {
          const errorData = await response.json();
          setError(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        setHotkeys([]);
        setDemoMode(false);
        return;
      }
      
      const data = await response.json();
      const isDemoMode = response.headers.get('X-Demo-Mode') === 'true';
      
      setDemoMode(isDemoMode);
      setHotkeys(data);
      
    } catch (err) {
      setError('Network error: Unable to connect to the server');
      setHotkeys([]);
    } finally {
      setLoading(false);
    }
  }

  const categories = ['all', 'productivity', 'testing', 'deployment', 'debugging', 'documentation', 'refactoring'];

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Hotkeys Marketplace
              {demoMode && (
                <span className="ml-3 px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded-full">
                  Demo Mode
                </span>
              )}
            </h1>
            <p className="text-text-dim">
              {demoMode 
                ? "Showing sample hotkeys - connect a real database to see live data"
                : "Discover and purchase AI coding hotkeys from the community"
              }
            </p>
          </div>
          <ConnectButton />
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <input
            type="text"
            placeholder="Search hotkeys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-bg-card border border-border rounded-lg focus:border-accent focus:outline-none"
          />
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-accent text-bg font-bold'
                    : 'bg-bg-card border border-border hover:border-accent'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
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
              title="No Hotkeys Found"
              description="Be the first to create and share hotkeys with the community!"
              action={{
                label: "Create the First Hotkey",
                onClick: () => window.location.href = "/dashboard/hotkeys/new"
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotkeys.map((hotkey) => (
                <Link
                  key={hotkey.id}
                  href={`/marketplace/${hotkey.id}`}
                  className="bg-bg-card border border-border hover:border-accent rounded-xl p-6 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold group-hover:text-accent transition-colors">
                      {hotkey.title}
                    </h3>
                    {hotkey.is_free ? (
                      <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-bold">
                        FREE
                      </span>
                    ) : (
                      <span className="text-lg font-bold">
                        ${hotkey.price_usd}
                      </span>
                    )}
                  </div>

                  <p className="text-text-dim mb-4 line-clamp-2">
                    {hotkey.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotkey.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-bg text-text-dim rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {hotkey.creator?.avatar_url ? (
                        <img
                          src={hotkey.creator.avatar_url}
                          alt={hotkey.creator.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-bg rounded-full" />
                      )}
                      <span className="text-text-dim">{hotkey.creator?.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-text-dim">
                      <span className="flex items-center gap-1">
                        ⭐ {hotkey.rating_average?.toFixed(1) || '0.0'}
                      </span>
                      <span>{hotkey.downloads} downloads</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </LoadingWrapper>
      </div>
    </main>
  );
}
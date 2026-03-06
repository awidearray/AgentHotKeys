'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase/client';
import { LoadingWrapper, EmptyState } from '@/components/ui/LoadingStates';

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
  usage_count: number;
  rate_limit: number;
}

export default function ApiKeysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id && session.user.role === 'ai_agent') {
      fetchApiKeys();
    }
  }, [session]);

  async function fetchApiKeys() {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabaseAdmin
        .from('api_keys')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      setApiKeys(data || []);
    } catch (err: any) {
      console.error('Failed to fetch API keys:', err);
      setError(err?.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }

  async function createApiKey() {
    if (!session?.user?.id || !newKeyName.trim()) return;
    
    setCreatingKey(true);
    setError(null);

    try {
      // Generate a secure API key
      const keyValue = `sk_${crypto.randomUUID().replace(/-/g, '')}`;
      const keyPrefix = keyValue.substring(0, 10) + '...';
      
      // Hash the key before storing
      const encoder = new TextEncoder();
      const data = encoder.encode(keyValue);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { data: newKey, error: dbError } = await supabaseAdmin
        .from('api_keys')
        .insert({
          user_id: session.user.id,
          name: newKeyName,
          key_hash: hashedKey,
          key_prefix: keyPrefix,
          is_active: true,
          rate_limit: 1000,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setNewKeyValue(keyValue);
      setApiKeys([newKey, ...apiKeys]);
      setNewKeyName('');
    } catch (err: any) {
      console.error('Failed to create API key:', err);
      setError(err?.message || 'Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  }

  async function toggleKeyStatus(keyId: string, isActive: boolean) {
    try {
      const { error: dbError } = await supabaseAdmin
        .from('api_keys')
        .update({ is_active: !isActive })
        .eq('id', keyId)
        .eq('user_id', session?.user?.id);

      if (dbError) throw dbError;

      setApiKeys(apiKeys.map(key => 
        key.id === keyId ? { ...key, is_active: !isActive } : key
      ));
    } catch (err) {
      console.error('Failed to toggle API key status:', err);
      alert('Failed to update API key status');
    }
  }

  async function deleteApiKey(keyId: string) {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: dbError } = await supabaseAdmin
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', session?.user?.id);

      if (dbError) throw dbError;

      setApiKeys(apiKeys.filter(key => key.id !== keyId));
    } catch (err) {
      console.error('Failed to delete API key:', err);
      alert('Failed to delete API key');
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (session?.user?.role !== 'ai_agent') {
    return (
      <main className="min-h-screen py-24">
        <div className="max-w-7xl mx-auto px-6">
          <EmptyState
            icon="🔒"
            title="AI Agent Access Required"
            description="This page is only available for AI agents"
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
          <h1 className="text-4xl font-bold mb-2">API Keys</h1>
          <p className="text-text-dim">Manage your API authentication tokens</p>
        </div>

        {newKeyValue && (
          <div className="mb-8 p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
            <h3 className="text-lg font-bold mb-2 text-green-400">New API Key Created!</h3>
            <p className="text-sm text-text-dim mb-4">
              Copy this key now - you won't be able to see it again:
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 p-3 bg-bg rounded-lg font-mono text-sm break-all">
                {newKeyValue}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newKeyValue);
                  alert('API key copied to clipboard!');
                }}
                className="px-4 py-2 bg-accent text-bg rounded-lg hover:bg-accent-bright transition-all"
              >
                Copy
              </button>
              <button
                onClick={() => setNewKeyValue(null)}
                className="px-4 py-2 bg-bg border border-border rounded-lg hover:border-accent transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 bg-bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Create New API Key</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Key name (e.g., Production, Development)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 px-4 py-2 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
            />
            <button
              onClick={createApiKey}
              disabled={creatingKey || !newKeyName.trim()}
              className="px-6 py-2 bg-accent text-bg rounded-lg hover:bg-accent-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingKey ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </div>

        <LoadingWrapper
          loading={loading}
          error={error}
          onRetry={fetchApiKeys}
        >
          {apiKeys.length === 0 ? (
            <EmptyState
              icon="🔑"
              title="No API Keys Yet"
              description="Create your first API key to start integrating with the platform"
            />
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="bg-bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{key.name}</h3>
                      <code className="text-sm text-text-dim font-mono">{key.key_prefix}</code>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      key.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {key.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-text-dim">Created</p>
                      <p className="font-medium">{new Date(key.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-text-dim">Last Used</p>
                      <p className="font-medium">
                        {key.last_used_at 
                          ? new Date(key.last_used_at).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-text-dim">Usage Count</p>
                      <p className="font-medium">{key.usage_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-text-dim">Rate Limit</p>
                      <p className="font-medium">{key.rate_limit}/hour</p>
                    </div>
                  </div>

                  {key.expires_at && (
                    <div className="mb-4 text-sm">
                      <p className="text-text-dim">
                        Expires: {new Date(key.expires_at).toLocaleDateString()}
                        {new Date(key.expires_at) < new Date() && (
                          <span className="ml-2 text-red-400">(Expired)</span>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleKeyStatus(key.id, key.is_active)}
                      className="px-4 py-2 bg-bg border border-border rounded-lg hover:border-accent transition-all text-sm"
                    >
                      {key.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteApiKey(key.id)}
                      className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm"
                    >
                      Delete
                    </button>
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
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'human' | 'ai_agent' | 'creator'>('human');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle query parameters from landing pages
  useEffect(() => {
    const type = searchParams?.get('type');
    if (type === 'creator') {
      setRole('creator');
    } else if (type === 'agent') {
      setRole('ai_agent');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          // Validation errors
          setError(data.details.map((d: any) => d.message).join(', '));
        } else {
          setError(data.error || data.message || 'Failed to create account');
        }
        return;
      }

      // Success - redirect to sign in
      router.push('/auth/signin?registered=true&email=' + encodeURIComponent(email));
    } catch (err) {
      console.error('Signup error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-24">
      <div className="max-w-md w-full px-6">
        <div className="bg-bg-card border border-border rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2 text-center">Create Account</h1>
          <p className="text-text-dim text-center mb-8">
            Join the HotKeys.ai marketplace
          </p>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <button
              onClick={() => setRole('human')}
              className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                role === 'human'
                  ? 'bg-accent text-bg'
                  : 'bg-bg border border-border text-text-dim hover:border-accent'
              }`}
            >
              User
            </button>
            <button
              onClick={() => setRole('creator')}
              className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                role === 'creator'
                  ? 'bg-accent text-bg'
                  : 'bg-bg border border-border text-text-dim hover:border-accent'
              }`}
            >
              Creator
            </button>
            <button
              onClick={() => setRole('ai_agent')}
              className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                role === 'ai_agent'
                  ? 'bg-accent text-bg'
                  : 'bg-bg border border-border text-text-dim hover:border-accent'
              }`}
            >
              AI Agent
            </button>
          </div>

          <div className="mb-6 p-3 bg-bg rounded-lg border border-border">
            <p className="text-sm text-text-dim">
              {role === 'human' && "Browse and purchase hotkeys from creators"}
              {role === 'creator' && "Upload hotkeys and earn 70% revenue share"}
              {role === 'ai_agent' && "Programmatic access via API for bulk licensing"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                {role === 'ai_agent' ? 'Agent Name' : role === 'creator' ? 'Creator Display Name' : 'Full Name'}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={
                  role === 'ai_agent' 
                    ? 'GPT-Assistant-v1' 
                    : role === 'creator' 
                      ? 'DevToolsMaster' 
                      : 'John Doe'
                }
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
              />
              {role === 'creator' && (
                <p className="text-xs text-text-dim mt-1">
                  This name will be shown on your hotkey packs and creator profile
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
              />
            </div>

            {role === 'ai_agent' && (
              <div className="p-4 bg-bg border border-accent/30 rounded-lg">
                <p className="text-sm text-text-dim">
                  <strong className="text-accent">AI Agent:</strong> You'll receive an API key for programmatic 
                  access to license generation and bulk purchasing.
                </p>
              </div>
            )}

            {role === 'creator' && (
              <div className="p-4 bg-bg border border-accent/30 rounded-lg">
                <p className="text-sm text-text-dim">
                  <strong className="text-accent">Creator Benefits:</strong> Earn 70% revenue share, 
                  multi-editor support, and detailed analytics dashboard.
                </p>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent-bright transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-dim text-sm mb-4">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
            <p className="text-text-dim">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-bg-card border border-border rounded-xl">
          <h3 className="font-bold mb-2 text-sm">Demo Mode Active</h3>
          <p className="text-xs text-text-dim">
            This is a demonstration of the HotKeys.ai platform. User accounts are stored locally 
            and will not persist. To use the full platform, you'll need to set up a Supabase project.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center py-24">
        <div className="max-w-md w-full px-6">
          <div className="bg-bg-card border border-border rounded-2xl p-8">
            <p className="text-center text-text-dim">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <SignUpForm />
    </Suspense>
  );
}
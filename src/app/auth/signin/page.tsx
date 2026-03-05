'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SignInPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [mode, setMode] = useState<'human' | 'agent'>('human');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(
        mode === 'agent' ? 'api-key' : 'credentials',
        {
          ...(mode === 'agent' ? { apiKey } : { email, password }),
          redirect: false,
        }
      );

      if (result?.error) {
        setError('Invalid credentials');
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: string) {
    setLoading(true);
    await signIn(provider, { callbackUrl: '/dashboard' });
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-24">
      <div className="max-w-md w-full px-6">
        <div className="bg-bg-card border border-border rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2 text-center">Sign In</h1>
          <p className="text-text-dim text-center mb-8">
            Welcome back to HotKeys.ai
          </p>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('human')}
              className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
                mode === 'human'
                  ? 'bg-accent text-bg'
                  : 'bg-bg border border-border text-text-dim'
              }`}
            >
              Human
            </button>
            <button
              onClick={() => setMode('agent')}
              className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
                mode === 'agent'
                  ? 'bg-accent text-bg'
                  : 'bg-bg border border-border text-text-dim'
              }`}
            >
              AI Agent
            </button>
          </div>

          {mode === 'human' ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent-bright transition-all disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-bg-card text-text-dim">Or continue with</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  className="w-full py-3 bg-bg border border-border rounded-lg font-medium hover:border-accent transition-all disabled:opacity-50"
                >
                  Continue with Google
                </button>
                <button
                  onClick={() => handleOAuth('github')}
                  disabled={loading}
                  className="w-full py-3 bg-bg border border-border rounded-lg font-medium hover:border-accent transition-all disabled:opacity-50"
                >
                  Continue with GitHub
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
                  API Key
                </label>
                <input
                  id="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  placeholder="Enter your AI agent API key"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none font-mono text-sm"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent-bright transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Authenticate Agent'}
              </button>

              <p className="text-text-dim text-sm text-center">
                API keys are used for programmatic access by AI agents
              </p>
            </form>
          )}

          <p className="text-center mt-6 text-text-dim">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-accent hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase/client';
import { LoadingWrapper } from '@/components/ui/LoadingStates';

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  website: string;
  twitter: string;
  github: string;
  notification_preferences: {
    email_purchases: boolean;
    email_updates: boolean;
    email_marketing: boolean;
  };
  payout_settings: {
    method: 'stripe' | 'crypto' | 'paypal';
    account_id: string;
  };
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    bio: '',
    website: '',
    twitter: '',
    github: '',
    notification_preferences: {
      email_purchases: true,
      email_updates: true,
      email_marketing: false
    },
    payout_settings: {
      method: 'stripe',
      account_id: ''
    }
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile();
    }
  }, [session]);

  async function fetchUserProfile() {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (dbError) throw dbError;

      setProfile({
        name: data.name || '',
        email: data.email || '',
        bio: data.bio || '',
        website: data.website || '',
        twitter: data.twitter || '',
        github: data.github || '',
        notification_preferences: data.notification_preferences || {
          email_purchases: true,
          email_updates: true,
          email_marketing: false
        },
        payout_settings: data.payout_settings || {
          method: 'stripe',
          account_id: ''
        }
      });
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!session?.user?.id) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({
          name: profile.name,
          bio: profile.bio,
          website: profile.website,
          twitter: profile.twitter,
          github: profile.github,
          notification_preferences: profile.notification_preferences,
          payout_settings: profile.payout_settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (dbError) throw dbError;

      // Update session with new name
      if (profile.name !== session.user.name) {
        await update({ name: profile.name });
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setError(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      return;
    }

    if (!confirm('This is your last chance to cancel. Are you absolutely sure?')) {
      return;
    }

    try {
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({
          deleted_at: new Date().toISOString(),
          email: `deleted_${Date.now()}@deleted.com`,
          name: 'Deleted User'
        })
        .eq('id', session?.user?.id);

      if (dbError) throw dbError;

      await signOut({ callbackUrl: '/' });
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Failed to delete account. Please contact support.');
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-text-dim">Manage your profile and preferences</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        <LoadingWrapper loading={loading} error={null} onRetry={fetchUserProfile}>
          <div className="space-y-8">
            {/* Profile Information */}
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Profile Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2 bg-bg border border-border rounded-lg opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-text-dim mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    className="w-full px-4 py-2 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Twitter</label>
                    <input
                      type="text"
                      value={profile.twitter}
                      onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                      className="w-full px-4 py-2 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">GitHub</label>
                    <input
                      type="text"
                      value={profile.github}
                      onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                      className="w-full px-4 py-2 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Email Notifications</h2>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Purchase Notifications</p>
                    <p className="text-sm text-text-dim">Get notified when someone buys your hotkeys</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.notification_preferences.email_purchases}
                    onChange={(e) => setProfile({
                      ...profile,
                      notification_preferences: {
                        ...profile.notification_preferences,
                        email_purchases: e.target.checked
                      }
                    })}
                    className="w-5 h-5 accent-accent"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Product Updates</p>
                    <p className="text-sm text-text-dim">Important updates about the platform</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.notification_preferences.email_updates}
                    onChange={(e) => setProfile({
                      ...profile,
                      notification_preferences: {
                        ...profile.notification_preferences,
                        email_updates: e.target.checked
                      }
                    })}
                    className="w-5 h-5 accent-accent"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-text-dim">Tips, promotions, and community highlights</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.notification_preferences.email_marketing}
                    onChange={(e) => setProfile({
                      ...profile,
                      notification_preferences: {
                        ...profile.notification_preferences,
                        email_marketing: e.target.checked
                      }
                    })}
                    className="w-5 h-5 accent-accent"
                  />
                </label>
              </div>
            </div>

            {/* Payout Settings (for creators) */}
            {session?.user?.role === 'creator' && (
              <div className="bg-bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6">Payout Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Payout Method</label>
                    <select
                      value={profile.payout_settings.method}
                      onChange={(e) => setProfile({
                        ...profile,
                        payout_settings: {
                          ...profile.payout_settings,
                          method: e.target.value as 'stripe' | 'crypto' | 'paypal'
                        }
                      })}
                      className="w-full px-4 py-2 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                    >
                      <option value="stripe">Stripe Connect</option>
                      <option value="crypto">Cryptocurrency</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {profile.payout_settings.method === 'stripe' && 'Stripe Account ID'}
                      {profile.payout_settings.method === 'crypto' && 'Wallet Address'}
                      {profile.payout_settings.method === 'paypal' && 'PayPal Email'}
                    </label>
                    <input
                      type="text"
                      value={profile.payout_settings.account_id}
                      onChange={(e) => setProfile({
                        ...profile,
                        payout_settings: {
                          ...profile.payout_settings,
                          account_id: e.target.value
                        }
                      })}
                      className="w-full px-4 py-2 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                      placeholder={
                        profile.payout_settings.method === 'stripe' ? 'acct_...' :
                        profile.payout_settings.method === 'crypto' ? '0x...' :
                        'email@example.com'
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 text-red-400">Danger Zone</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Delete Account</h3>
                  <p className="text-sm text-text-dim mb-4">
                    Once you delete your account, there is no going back. All your data will be permanently removed.
                  </p>
                  <button
                    onClick={deleteAccount}
                    className="px-6 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-bg border border-border rounded-lg hover:border-accent transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-6 py-3 bg-accent text-bg rounded-lg hover:bg-accent-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </LoadingWrapper>
      </div>
    </main>
  );
}
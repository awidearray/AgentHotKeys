'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { safeDbOperation } from '@/lib/supabase/client';
import { LoadingButton, PageLoading } from '@/components/ui/LoadingStates';
import { ApiError } from '@/components/ui/ErrorBoundary';

// Validation schema for hotkey editing
const HotkeySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
  category: z.string().min(1, 'Please select a category'),
  tags: z.array(z.string()).min(1, 'Add at least one tag').max(5, 'Maximum 5 tags allowed'),
  price_usd: z.number().min(0, 'Price must be positive').max(1000, 'Maximum price is $1000'),
  is_free: z.boolean(),
  keybinding: z.string().min(1, 'Keybinding is required'),
  command: z.string().min(1, 'Command is required'),
  compatibility: z.array(z.string()).min(1, 'Select at least one compatible editor'),
  instructions: z.string().optional(),
});

type HotkeyFormData = z.infer<typeof HotkeySchema>;

interface EditHotkeyPageProps {
  params: Promise<{ id: string }>;
}

export default function EditHotkeyPage({ params }: EditHotkeyPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hotkeyStatus, setHotkeyStatus] = useState<string>('');
  const [hotkeyId, setHotkeyId] = useState<string>('');

  const [formData, setFormData] = useState<HotkeyFormData>({
    title: '',
    description: '',
    category: '',
    tags: [],
    price_usd: 0,
    is_free: true,
    keybinding: '',
    command: '',
    compatibility: [],
    instructions: '',
  });

  const categories = [
    'productivity',
    'testing',
    'deployment',
    'debugging',
    'documentation',
    'refactoring',
    'ui-development',
    'backend-development'
  ];

  const compatibleEditors = [
    'vs-code',
    'cursor',
    'claude-code',
    'vim',
    'neovim',
    'emacs',
    'sublime-text',
    'atom'
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      setHotkeyId(resolvedParams.id);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (session?.user?.id && hotkeyId) {
      fetchHotkey();
    }
  }, [session, hotkeyId]);

  async function fetchHotkey() {
    if (!session?.user?.id) return;
    
    setPageLoading(true);
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
            content,
            creator_id
          `)
          .eq('id', hotkeyId)
          .eq('creator_id', session.user.id)
          .single();
      });

      if (!result.success) {
        // Fallback to demo data
        const demoHotkey = {
          id: hotkeyId,
          title: 'Demo Hotkey',
          description: 'This is a demo hotkey for testing purposes',
          category: 'productivity',
          tags: ['demo', 'test'],
          price_usd: 25,
          is_free: false,
          status: 'draft',
          content: {
            keybinding: 'Ctrl+D',
            command: 'demo_command',
            compatibility: ['vs-code', 'cursor'],
            instructions: 'Demo instructions'
          },
          creator_id: session.user.id
        };
        
        setFormData({
          title: demoHotkey.title,
          description: demoHotkey.description,
          category: demoHotkey.category,
          tags: demoHotkey.tags,
          price_usd: demoHotkey.price_usd,
          is_free: demoHotkey.is_free,
          keybinding: demoHotkey.content.keybinding,
          command: demoHotkey.content.command,
          compatibility: demoHotkey.content.compatibility,
          instructions: demoHotkey.content.instructions || '',
        });
        setHotkeyStatus(demoHotkey.status);
        setError('Database unavailable. Showing demo data.');
        return;
      }

      const hotkey = result.data;
      if (!hotkey) {
        router.push('/dashboard/hotkeys');
        return;
      }

      setFormData({
        title: (hotkey as any).title,
        description: (hotkey as any).description,
        category: (hotkey as any).category,
        tags: (hotkey as any).tags || [],
        price_usd: (hotkey as any).price_usd || 0,
        is_free: (hotkey as any).is_free,
        keybinding: (hotkey as any).content?.keybinding || '',
        command: (hotkey as any).content?.command || '',
        compatibility: (hotkey as any).content?.compatibility || [],
        instructions: (hotkey as any).content?.instructions || '',
      });
      setHotkeyStatus((hotkey as any).status);

    } catch (error) {
      console.error('Fetch hotkey error:', error);
      setError('Failed to load hotkey. Please refresh the page.');
    } finally {
      setPageLoading(false);
    }
  }

  const handleInputChange = (field: keyof HotkeyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      const newTag = target.value.trim().toLowerCase();
      
      if (newTag && !formData.tags.includes(newTag) && formData.tags.length < 5) {
        handleInputChange('tags', [...formData.tags, newTag]);
        target.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const toggleCompatibility = (editor: string) => {
    const newCompatibility = formData.compatibility.includes(editor)
      ? formData.compatibility.filter(e => e !== editor)
      : [...formData.compatibility, editor];
    handleInputChange('compatibility', newCompatibility);
  };

  const validateForm = (): boolean => {
    try {
      HotkeySchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          errors[field] = issue.message;
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the validation errors above');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/hotkeys', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: hotkeyId,
          ...formData,
          content: {
            keybinding: formData.keybinding,
            command: formData.command,
            description: formData.description,
            compatibility: formData.compatibility,
            instructions: formData.instructions,
          },
          preview_content: {
            keybinding: formData.keybinding,
            description: formData.description.substring(0, 100),
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          // Validation errors from server
          const errors: Record<string, string> = {};
          data.details.forEach((detail: any) => {
            errors[detail.path?.[0] || 'general'] = detail.message;
          });
          setValidationErrors(errors);
        } else {
          setError(data.error || 'Failed to update hotkey');
        }
        return;
      }

      // Success - redirect to hotkeys list
      router.push('/dashboard/hotkeys?updated=true');
    } catch (err) {
      console.error('Update hotkey error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this hotkey? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/hotkeys?id=${hotkeyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete hotkey');
        return;
      }

      router.push('/dashboard/hotkeys?deleted=true');
    } catch (err) {
      console.error('Delete hotkey error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || pageLoading) {
    return <PageLoading />;
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

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Edit Hotkey</h1>
            <p className="text-text-dim">Update your coding hotkey</p>
          </div>
          <div className="text-right">
            <span className={`text-sm font-medium ${getStatusColor(hotkeyStatus)}`}>
              Status: {hotkeyStatus.charAt(0).toUpperCase() + hotkeyStatus.slice(1).replace('_', ' ')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Hotkey Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                />
                {validationErrors.title && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none resize-vertical"
                />
                {validationErrors.description && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.description}</p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
                {validationErrors.category && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.category}</p>
                )}
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium mb-2">
                  Tags (up to 5)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-accent hover:text-accent-bright"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tags (press Enter or comma to add)"
                  onKeyDown={handleTagInput}
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                />
                {validationErrors.tags && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.tags}</p>
                )}
              </div>
            </div>
          </div>

          {/* Hotkey Details - Similar to create page but abbreviated for space */}
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Hotkey Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="keybinding" className="block text-sm font-medium mb-2">
                  Key Binding
                </label>
                <input
                  id="keybinding"
                  type="text"
                  value={formData.keybinding}
                  onChange={(e) => handleInputChange('keybinding', e.target.value)}
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                />
                {validationErrors.keybinding && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.keybinding}</p>
                )}
              </div>

              <div>
                <label htmlFor="command" className="block text-sm font-medium mb-2">
                  Command/Action
                </label>
                <input
                  id="command"
                  type="text"
                  value={formData.command}
                  onChange={(e) => handleInputChange('command', e.target.value)}
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                />
                {validationErrors.command && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.command}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Compatible Editors
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {compatibleEditors.map((editor) => (
                  <label key={editor} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.compatibility.includes(editor)}
                      onChange={() => toggleCompatibility(editor)}
                      className="w-4 h-4 text-accent bg-bg border-border rounded focus:ring-accent focus:ring-2"
                    />
                    <span className="text-sm">
                      {editor.charAt(0).toUpperCase() + editor.slice(1).replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>
              {validationErrors.compatibility && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.compatibility}</p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Pricing</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pricing"
                    checked={formData.is_free}
                    onChange={() => {
                      handleInputChange('is_free', true);
                      handleInputChange('price_usd', 0);
                    }}
                    className="w-4 h-4 text-accent bg-bg border-border"
                  />
                  <span>Free</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pricing"
                    checked={!formData.is_free}
                    onChange={() => handleInputChange('is_free', false)}
                    className="w-4 h-4 text-accent bg-bg border-border"
                  />
                  <span>Paid</span>
                </label>
              </div>

              {!formData.is_free && (
                <div className="max-w-xs">
                  <label htmlFor="price" className="block text-sm font-medium mb-2">
                    Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-text-dim">$</span>
                    <input
                      id="price"
                      type="number"
                      min="0"
                      max="1000"
                      step="0.01"
                      value={formData.price_usd}
                      onChange={(e) => handleInputChange('price_usd', parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>
                  {validationErrors.price_usd && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.price_usd}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && <ApiError error={error} />}

          <div className="flex justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard/hotkeys')}
                className="px-6 py-3 bg-bg border border-border rounded-lg font-medium hover:border-accent transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
              >
                Delete
              </button>
            </div>
            <LoadingButton
              type="submit"
              loading={loading}
              className="px-8 py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent-bright transition-all"
            >
              Update Hotkey
            </LoadingButton>
          </div>
        </form>
      </div>
    </main>
  );
}
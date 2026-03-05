'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { LoadingButton } from '@/components/ui/LoadingStates';
import { ApiError } from '@/components/ui/ErrorBoundary';

// Validation schema for hotkey creation
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

export default function CreateHotkeyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          setError(data.error || 'Failed to create hotkey');
        }
        return;
      }

      // Success - redirect to hotkeys list
      router.push('/dashboard/hotkeys?created=true');
    } catch (err) {
      console.error('Create hotkey error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create New Hotkey</h1>
          <p className="text-text-dim">Share your coding shortcuts with the community</p>
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
                  placeholder="e.g., Force Real Implementation"
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
                  placeholder="Describe what this hotkey does and when to use it..."
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

          {/* Hotkey Details */}
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Hotkey Details</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="keybinding" className="block text-sm font-medium mb-2">
                  Key Binding
                </label>
                <input
                  id="keybinding"
                  type="text"
                  value={formData.keybinding}
                  onChange={(e) => handleInputChange('keybinding', e.target.value)}
                  placeholder="e.g., Ctrl+1 or Cmd+Shift+R"
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
                  placeholder="e.g., force_real_implementation"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
                />
                {validationErrors.command && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.command}</p>
                )}
              </div>

              <div>
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

              <div>
                <label htmlFor="instructions" className="block text-sm font-medium mb-2">
                  Usage Instructions (Optional)
                </label>
                <textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="Detailed instructions on how to use this hotkey..."
                  rows={4}
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none resize-vertical"
                />
              </div>
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
                <div>
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
            <button
              type="button"
              onClick={() => router.push('/dashboard/hotkeys')}
              className="px-6 py-3 bg-bg border border-border rounded-lg font-medium hover:border-accent transition-all"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              loading={loading}
              className="px-8 py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent-bright transition-all"
            >
              Create Hotkey
            </LoadingButton>
          </div>
        </form>
      </div>
    </main>
  );
}
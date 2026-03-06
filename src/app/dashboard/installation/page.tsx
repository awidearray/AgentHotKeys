'use client';

import { useSession } from 'next-auth/react';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/client';
import Link from 'next/link';

interface Editor {
  id: string;
  name: string;
  icon: string;
  command: string;
  instructions: string[];
  supported: boolean;
}

const editors: Editor[] = [
  {
    id: 'vscode',
    name: 'VS Code',
    icon: '📝',
    command: 'code --install-extension hotkeys-ai.hotkeys',
    instructions: [
      'Open VS Code',
      'Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)',
      'Type "Install from VSIX" and select it',
      'Navigate to your downloaded hotkey file',
      'Restart VS Code to activate'
    ],
    supported: true
  },
  {
    id: 'cursor',
    name: 'Cursor',
    icon: '⚡',
    command: 'cursor --install-extension hotkeys-ai.hotkeys',
    instructions: [
      'Open Cursor',
      'Navigate to Extensions (Cmd+Shift+X)',
      'Click the ... menu and select "Install from VSIX"',
      'Select your downloaded hotkey file',
      'Reload window to activate'
    ],
    supported: true
  },
  {
    id: 'vim',
    name: 'Vim/Neovim',
    icon: '🖥️',
    command: ':source ~/.hotkeys-ai/hotkeys.vim',
    instructions: [
      'Copy hotkey file to ~/.hotkeys-ai/',
      'Add "source ~/.hotkeys-ai/hotkeys.vim" to your .vimrc',
      'Restart Vim or run :source ~/.vimrc',
      'Verify with :map to see new bindings'
    ],
    supported: true
  },
  {
    id: 'sublime',
    name: 'Sublime Text',
    icon: '🎨',
    command: 'subl --command "install_hotkeys"',
    instructions: [
      'Open Sublime Text',
      'Go to Preferences > Browse Packages',
      'Create a "HotkeysAI" folder',
      'Copy your hotkey file there',
      'Restart Sublime Text'
    ],
    supported: true
  },
  {
    id: 'jetbrains',
    name: 'JetBrains IDEs',
    icon: '🚀',
    command: 'idea install-plugin hotkeys-ai',
    instructions: [
      'Open your JetBrains IDE',
      'Go to Settings > Plugins',
      'Click gear icon > Install Plugin from Disk',
      'Select your hotkey file',
      'Restart the IDE'
    ],
    supported: true
  },
  {
    id: 'emacs',
    name: 'Emacs',
    icon: '📚',
    command: 'M-x package-install hotkeys-ai',
    instructions: [
      'Copy hotkey file to ~/.emacs.d/hotkeys/',
      'Add (load "~/.emacs.d/hotkeys/hotkeys.el") to init.el',
      'Reload config with M-x eval-buffer',
      'Check bindings with C-h b'
    ],
    supported: false
  }
];

function InstallationHubContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hotkeyId = searchParams.get('hotkey');
  
  const [selectedEditor, setSelectedEditor] = useState<Editor>(editors[0]);
  const [hotkey, setHotkey] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (hotkeyId && session?.user?.id) {
      fetchHotkey();
    }
  }, [hotkeyId, session]);

  async function fetchHotkey() {
    if (!hotkeyId || !session?.user?.id) return;
    
    setLoading(true);
    try {
      // Check if user has access to this hotkey
      const { data: purchase } = await supabaseAdmin
        .from('purchases')
        .select('hotkey:hotkeys(*)')
        .eq('hotkey_id', hotkeyId)
        .eq('buyer_id', session.user.id)
        .eq('status', 'completed')
        .single();

      if (purchase?.hotkey) {
        setHotkey(purchase.hotkey);
      }
    } catch (err) {
      console.error('Failed to fetch hotkey:', err);
    } finally {
      setLoading(false);
    }
  }

  async function trackInstallation(editorId: string) {
    if (!session?.user?.id || !hotkeyId) return;

    try {
      await supabaseAdmin
        .from('installation_events')
        .insert({
          user_id: session.user.id,
          hotkey_id: hotkeyId,
          editor: editorId,
          event_type: 'install_started'
        });
    } catch (err) {
      console.error('Failed to track installation:', err);
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Installation Hub</h1>
          <p className="text-text-dim">
            Step-by-step guides to install your hotkeys in any editor
          </p>
          {hotkey && (
            <div className="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="text-sm">
                Installing: <span className="font-bold">{hotkey.title}</span>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Selection */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold mb-4">Select Your Editor</h2>
            <div className="space-y-2">
              {editors.map((editor) => (
                <button
                  key={editor.id}
                  onClick={() => {
                    setSelectedEditor(editor);
                    trackInstallation(editor.id);
                  }}
                  className={`w-full p-4 rounded-lg border transition-all text-left ${
                    selectedEditor.id === editor.id
                      ? 'bg-accent/10 border-accent'
                      : 'bg-bg-card border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{editor.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{editor.name}</p>
                      {!editor.supported && (
                        <p className="text-xs text-yellow-400">Coming Soon</p>
                      )}
                    </div>
                    {selectedEditor.id === editor.id && (
                      <span className="text-accent">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="lg:col-span-2">
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{selectedEditor.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold">{selectedEditor.name} Installation</h2>
                  {!selectedEditor.supported && (
                    <p className="text-sm text-yellow-400">Support coming soon</p>
                  )}
                </div>
              </div>

              {selectedEditor.supported ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Quick Install Command</h3>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 p-3 bg-bg rounded-lg font-mono text-sm">
                        {selectedEditor.command}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedEditor.command);
                          alert('Command copied to clipboard!');
                        }}
                        className="px-4 py-2 bg-accent text-bg rounded-lg hover:bg-accent-bright transition-all"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Manual Installation Steps</h3>
                    <ol className="space-y-3">
                      {selectedEditor.instructions.map((step, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="flex-shrink-0 w-8 h-8 bg-accent/20 text-accent rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </span>
                          <p className="pt-1">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <h4 className="font-bold mb-2 text-blue-400">💡 Pro Tips</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Make sure to backup your existing keybindings before installation</li>
                      <li>• Some hotkeys may conflict with default editor shortcuts</li>
                      <li>• You can customize keybindings after installation in your editor settings</li>
                      <li>• Join our Discord for installation support and troubleshooting</li>
                    </ul>
                  </div>

                  {hotkey && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h3 className="text-lg font-bold mb-3">Hotkey Details</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-text-dim">Title:</span> {hotkey.title}</p>
                        <p><span className="text-text-dim">Category:</span> {hotkey.category}</p>
                        <p><span className="text-text-dim">Compatibility:</span> {hotkey.content?.compatibility?.join(', ') || 'All editors'}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚧</div>
                  <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
                  <p className="text-text-dim mb-6">
                    {selectedEditor.name} support is under development
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-block px-6 py-3 bg-accent text-bg rounded-lg hover:bg-accent-bright transition-all"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              )}
            </div>

            {/* Video Tutorial Section */}
            {selectedEditor.supported && (
              <div className="mt-6 bg-bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Video Tutorial</h3>
                <div className="aspect-video bg-bg rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎬</div>
                    <p className="text-text-dim">Video tutorial coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {/* Support Section */}
            <div className="mt-6 bg-bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Need Help?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/docs"
                  className="p-4 bg-bg border border-border rounded-lg hover:border-accent transition-all text-center"
                >
                  <div className="text-2xl mb-2">📖</div>
                  <p className="font-medium">Documentation</p>
                </Link>
                <Link
                  href="/discord"
                  className="p-4 bg-bg border border-border rounded-lg hover:border-accent transition-all text-center"
                >
                  <div className="text-2xl mb-2">💬</div>
                  <p className="font-medium">Discord Support</p>
                </Link>
                <Link
                  href="/support"
                  className="p-4 bg-bg border border-border rounded-lg hover:border-accent transition-all text-center"
                >
                  <div className="text-2xl mb-2">📧</div>
                  <p className="font-medium">Contact Support</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function InstallationHubPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <InstallationHubContent />
    </Suspense>
  );
}
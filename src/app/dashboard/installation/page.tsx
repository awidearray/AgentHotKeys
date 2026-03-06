'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InstallationHubPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedEditor, setSelectedEditor] = useState<'vscode' | 'jetbrains' | 'sublime'>('vscode');
  const [installingLicense, setInstallingLicense] = useState<string | null>(null);

  // Mock user licenses - in real implementation, this would come from API
  const userLicenses = [
    {
      id: 'lic_1',
      key: 'HOTK-A1B2-C3D4-E5F6',
      hotkeyPacks: ['VS Code Productivity Pack', 'React Development Essentials'],
      status: 'active',
      deviceCount: 1,
      maxDevices: 3,
      installedEditors: ['vscode'],
      creator: 'DevMaster',
    },
    {
      id: 'lic_2', 
      key: 'HOTK-G7H8-I9J0-K1L2',
      hotkeyPacks: ['JavaScript Power User'],
      status: 'active',
      deviceCount: 0,
      maxDevices: 1,
      installedEditors: [],
      creator: 'CodeNinja',
    }
  ];

  const editors = [
    {
      id: 'vscode',
      name: 'VS Code',
      icon: '📝',
      description: 'Visual Studio Code',
      installed: true,
      version: '1.85.0'
    },
    {
      id: 'jetbrains',
      name: 'JetBrains',
      icon: '🧠',
      description: 'IntelliJ, WebStorm, etc.',
      installed: false,
      version: null
    },
    {
      id: 'sublime',
      name: 'Sublime Text',
      icon: '📄',
      description: 'Sublime Text Editor',
      installed: true,
      version: '4.0'
    }
  ];

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const handleInstall = async (licenseId: string, editorId: string) => {
    setInstallingLicense(licenseId);
    
    // Simulate installation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, this would:
    // 1. Call the hotkey installer API
    // 2. Download and configure hotkeys for the editor
    // 3. Update license activation status
    
    setInstallingLicense(null);
    
    // Show success message or update UI
    alert('Hotkeys installed successfully!');
  };

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Installation Hub</h1>
          <p className="text-text-dim">Install and manage your hotkeys across different editors</p>
        </div>

        {/* Editor Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Detected Editors</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {editors.map((editor) => (
              <div
                key={editor.id}
                className={`bg-bg-card border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  selectedEditor === editor.id
                    ? 'border-accent'
                    : editor.installed
                      ? 'border-border hover:border-accent'
                      : 'border-border opacity-60'
                }`}
                onClick={() => editor.installed && setSelectedEditor(editor.id as any)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{editor.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold">{editor.name}</h3>
                    <p className="text-text-dim text-sm">{editor.description}</p>
                  </div>
                </div>
                
                {editor.installed ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-green-400 text-sm font-medium">Detected v{editor.version}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    <span className="text-text-dim text-sm">Not detected</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* License Installation */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Licenses</h2>
          
          {userLicenses.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold mb-2">No licenses found</h3>
              <p className="text-text-dim mb-6">Purchase hotkey packs from the marketplace to get started.</p>
              <button
                onClick={() => router.push('/marketplace')}
                className="bg-accent text-bg px-6 py-3 rounded-lg font-bold hover:bg-accent-bright transition-all"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {userLicenses.map((license) => (
                <div key={license.id} className="bg-bg-card border border-border rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{license.hotkeyPacks.join(', ')}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          license.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {license.status}
                        </span>
                      </div>
                      <p className="text-text-dim text-sm mb-2">
                        License: <span className="font-mono">{license.key}</span>
                      </p>
                      <p className="text-text-dim text-sm mb-3">
                        by {license.creator} • {license.deviceCount}/{license.maxDevices} devices used
                      </p>
                      
                      <div className="flex gap-2 flex-wrap">
                        {license.installedEditors.map((editorId) => (
                          <span key={editorId} className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-medium">
                            {editors.find(e => e.id === editorId)?.name} ✓
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      {license.deviceCount < license.maxDevices && (
                        <button
                          onClick={() => handleInstall(license.id, selectedEditor)}
                          disabled={installingLicense === license.id || license.installedEditors.includes(selectedEditor)}
                          className="px-4 py-2 bg-accent text-bg rounded-lg font-medium hover:bg-accent-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {installingLicense === license.id 
                            ? 'Installing...' 
                            : license.installedEditors.includes(selectedEditor)
                              ? 'Installed'
                              : `Install to ${editors.find(e => e.id === selectedEditor)?.name}`
                          }
                        </button>
                      )}
                      
                      <button className="px-4 py-2 bg-bg border border-border rounded-lg font-medium hover:border-accent transition-all">
                        Manage
                      </button>
                    </div>
                  </div>
                  
                  {license.deviceCount >= license.maxDevices && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        ⚠️ Device limit reached. Deactivate an existing installation to install on a new device.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Installation Instructions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Installation Guide</h2>
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold mb-4">How Installation Works</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-accent text-xs font-bold">1</span>
                    <p className="text-text-dim">Select your editor from the detected list above</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-accent text-xs font-bold">2</span>
                    <p className="text-text-dim">Click "Install" on any active license</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-accent text-xs font-bold">3</span>
                    <p className="text-text-dim">Hotkeys are automatically configured in your editor</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-accent text-xs font-bold">4</span>
                    <p className="text-text-dim">Restart your editor to activate the new hotkeys</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-4">Troubleshooting</h3>
                <div className="space-y-3 text-sm text-text-dim">
                  <p><strong>Editor not detected?</strong> Make sure it's installed and in your PATH.</p>
                  <p><strong>Installation failed?</strong> Try running your editor as administrator.</p>
                  <p><strong>Hotkeys not working?</strong> Check for conflicts in your existing keybindings.</p>
                  <p><strong>Need help?</strong> Contact support with your license key.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
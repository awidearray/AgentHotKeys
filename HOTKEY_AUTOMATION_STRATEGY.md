# Hotkey Automation Platform Strategy

## Overview
Transform from selling static PDF guides to selling automated hotkey installations that configure AI coding tools directly on users' devices. This approach provides better security, user experience, and value proposition.

## Implementation Architecture

### 1. Client-Side Installer App
Instead of PDFs, users download a lightweight installer that:
- Authenticates their purchase
- Detects installed AI tools (Cursor, Windsurf, Cody, etc.)
- Automatically configures hotkeys
- Binds to their device

### 2. Technology Stack Options

#### Option A: Electron App (Recommended)
```javascript
// Cross-platform desktop app
const installer = {
  platform: 'Electron',
  pros: [
    'Works on Windows, Mac, Linux',
    'Can access system APIs',
    'Can modify config files directly',
    'Native feel'
  ],
  implementation: 'electron + node.js'
};
```

#### Option B: Browser Extension
```javascript
// For web-based AI tools
const extension = {
  platform: 'Chrome/Firefox Extension',
  pros: [
    'Easy distribution via web stores',
    'Auto-updates',
    'Sandboxed security'
  ],
  limitations: [
    'Only works for web-based tools',
    'Limited system access'
  ]
};
```

#### Option C: Native CLI Tool
```javascript
// Command-line installer
const cli = {
  platform: 'Native CLI',
  pros: [
    'Lightweight',
    'Scriptable',
    'Power user friendly'
  ],
  distribution: 'npm, homebrew, chocolatey'
};
```

## Security & Anti-Piracy Measures

### 1. Device Binding
```typescript
interface LicenseActivation {
  userId: string;
  deviceId: string; // Hardware fingerprint
  activatedAt: Date;
  expiresAt?: Date;
  maxDevices: number;
}

// Generate unique device fingerprint
function getDeviceFingerprint(): string {
  return crypto.createHash('sha256')
    .update(os.hostname())
    .update(os.cpus()[0].model)
    .update(os.networkInterfaces().mac)
    .digest('hex');
}
```

### 2. License Server
```typescript
// Backend validation
async function activateLicense(licenseKey: string, deviceId: string) {
  // Check if license is valid
  const license = await db.licenses.findOne({ key: licenseKey });
  
  if (!license || license.used) {
    throw new Error('Invalid or already used license');
  }
  
  // Check device limit
  const activations = await db.activations.count({ licenseId: license.id });
  if (activations >= license.maxDevices) {
    throw new Error('Device limit reached');
  }
  
  // Activate
  return await db.activations.create({
    licenseId: license.id,
    deviceId,
    activatedAt: new Date()
  });
}
```

### 3. Hotkey Configuration System

#### For VS Code/Cursor
```typescript
// Modify keybindings.json
async function installVSCodeHotkeys(hotkeys: Hotkey[]) {
  const keybindingsPath = path.join(
    os.homedir(),
    '.config/Code/User/keybindings.json'
  );
  
  const existing = JSON.parse(await fs.readFile(keybindingsPath, 'utf8'));
  
  const newBindings = hotkeys.map(hk => ({
    key: hk.key,
    command: hk.command,
    when: hk.context,
    args: hk.args
  }));
  
  await fs.writeFile(
    keybindingsPath,
    JSON.stringify([...existing, ...newBindings], null, 2)
  );
}
```

#### For JetBrains IDEs
```xml
<!-- Modify keymap XML -->
<keymap version="1" name="AI Hotkeys">
  <action id="ai.complete" class="com.ai.CompleteAction">
    <keyboard-shortcut first-keystroke="ctrl alt space"/>
  </action>
</keymap>
```

## Implementation Plan

### Phase 1: MVP Installer
```typescript
// Basic installer structure
class HotkeyInstaller {
  private licenseServer: string;
  private deviceId: string;
  
  async install(licenseKey: string) {
    // 1. Validate license
    const activation = await this.activate(licenseKey);
    
    // 2. Detect installed tools
    const tools = await this.detectTools();
    
    // 3. Install hotkeys for each tool
    for (const tool of tools) {
      await this.installHotkeys(tool, activation.hotkeys);
    }
    
    // 4. Store activation locally
    await this.storeActivation(activation);
  }
  
  private async detectTools(): Promise<Tool[]> {
    const tools = [];
    
    // Check for VS Code/Cursor
    if (await this.checkVSCode()) {
      tools.push({ type: 'vscode', path: this.getVSCodePath() });
    }
    
    // Check for JetBrains
    if (await this.checkJetBrains()) {
      tools.push({ type: 'jetbrains', path: this.getJetBrainsPath() });
    }
    
    return tools;
  }
}
```

### Phase 2: Distribution System

#### Download Flow
1. User purchases on website
2. Receives unique download link
3. Downloads installer (signed executable)
4. Runs installer with license key
5. Hotkeys automatically configured

#### Update Mechanism
```typescript
// Auto-update hotkeys
class HotkeyUpdater {
  async checkUpdates() {
    const current = await this.getCurrentVersion();
    const latest = await this.fetchLatestVersion();
    
    if (latest.version > current.version) {
      await this.downloadAndApply(latest);
    }
  }
}
```

## Monetization Models

### 1. One-Time Purchase
- User buys specific hotkey pack
- Lifetime updates for that pack
- Device transfer allowed (with deactivation)

### 2. Subscription Model
- Monthly/yearly access to all hotkeys
- Continuous updates
- Multiple device support

### 3. Tiered Licensing
```typescript
enum LicenseTier {
  BASIC = 'basic',     // 1 device, basic hotkeys
  PRO = 'pro',         // 3 devices, all hotkeys
  TEAM = 'team',       // 10 devices, team management
  ENTERPRISE = 'enterprise' // Unlimited, custom hotkeys
}
```

## Platform-Specific Implementations

### macOS
```bash
# Use defaults command for some apps
defaults write com.microsoft.VSCode ApplePressAndHoldEnabled -bool false

# Modify plist files
/usr/libexec/PlistBuddy -c "Add :KeyBindings: dict" ~/Library/Preferences/com.app.plist
```

### Windows
```powershell
# Modify registry for system-wide hotkeys
New-ItemProperty -Path "HKCU:\Software\Classes\*\shell\AIComplete" `
  -Name "HotKey" -Value "Ctrl+Alt+Space"

# Or use AutoHotkey scripts
$ahkScript = @"
^!Space::
  Send, {F1}
  Return
"@
```

### Linux
```bash
# Modify config files directly
echo 'bind "ctrl+alt+space" "ai-complete"' >> ~/.config/tool/hotkeys.conf

# Or use xbindkeys
echo '"ai-complete"
  Control+Alt+space' >> ~/.xbindkeysrc
```

## Advantages Over PDF Distribution

1. **Piracy Protection**
   - Can't share executable without license
   - Device-bound activations
   - License revocation possible

2. **Better UX**
   - One-click setup
   - No manual configuration
   - Automatic updates

3. **Analytics**
   - Track which hotkeys are used
   - Understand user patterns
   - Improve based on data

4. **Support**
   - Remote troubleshooting
   - Automatic conflict resolution
   - Version management

## Security Considerations

### Code Signing
```bash
# Sign the installer
codesign --sign "Developer ID" --deep HotkeyInstaller.app

# Windows signing
signtool sign /a /tr http://timestamp.digicert.com installer.exe
```

### Encryption
```typescript
// Encrypt sensitive config
const encrypted = crypto.encrypt(hotkeys, userKey);
await fs.writeFile('.hotkeys.enc', encrypted);
```

### API Security
```typescript
// Rate limit license checks
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many activation attempts'
});

app.post('/activate', rateLimiter, validateLicense);
```

## Revenue Protection Strategy

1. **License Generation**
```typescript
function generateLicense(): string {
  const payload = {
    id: uuid(),
    tier: 'pro',
    devices: 3,
    expires: null,
    created: Date.now()
  };
  
  return jwt.sign(payload, SECRET_KEY);
}
```

2. **Activation Tracking**
```sql
-- Track all activations
CREATE TABLE activations (
  id UUID PRIMARY KEY,
  license_id UUID REFERENCES licenses(id),
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  activated_at TIMESTAMP,
  last_seen TIMESTAMP,
  deactivated_at TIMESTAMP
);
```

3. **Fraud Detection**
```typescript
// Detect suspicious patterns
async function detectFraud(licenseId: string) {
  const activations = await getActivations(licenseId);
  
  // Too many different devices in short time
  if (activations.uniqueDevices > 10 && activations.timeSpan < DAY) {
    return { suspicious: true, reason: 'Rapid device switching' };
  }
  
  // Geographic impossibility
  if (hasImpossibleGeoPattern(activations)) {
    return { suspicious: true, reason: 'Impossible travel' };
  }
}
```

## Next Steps

1. **Prototype Development**
   - Build Electron app MVP
   - Test with VS Code/Cursor
   - Implement basic licensing

2. **Security Hardening**
   - Add device fingerprinting
   - Implement license server
   - Add code signing

3. **Distribution Setup**
   - Create download portal
   - Set up CDN
   - Implement auto-updates

4. **Market Testing**
   - Beta test with select users
   - Gather feedback
   - Refine installation process

This approach transforms your product from a static document to a dynamic, secure software solution that provides ongoing value and protection against piracy.
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { logger } from '@/lib/logger';

interface Hotkey {
  id: string;
  key: string;
  command: string;
  when?: string;
  args?: any;
  description: string;
  // Creator attribution
  creator?: {
    id: string;
    name: string;
    type: 'human' | 'ai_agent';
    avatar_url?: string;
    verified: boolean;
  };
  pack_id?: string;
  source?: string; // 'marketplace', 'ai_agent_api', 'reseller'
}

interface Tool {
  name: string;
  type: 'vscode' | 'cursor' | 'jetbrains' | 'sublime' | 'vim';
  configPath: string;
  installed: boolean;
  version?: string;
}

interface License {
  key: string;
  userId: string;
  deviceId: string;
  hotkeys: Hotkey[];
  maxDevices: number;
  expiresAt?: Date;
  // Creator attribution
  creators: Creator[];
  attribution_required: boolean;
  reseller?: {
    id: string;
    name: string;
  };
}

interface Creator {
  id: string;
  name: string;
  type: 'human' | 'ai_agent';
  avatar_url?: string;
  verified: boolean;
  hotkey_count: number;
  reputation_score: number;
}

export class HotkeyInstaller {
  private deviceId: string;
  private platform: NodeJS.Platform;
  private licenseServerUrl: string;

  constructor(licenseServerUrl = process.env.NEXT_PUBLIC_LICENSE_SERVER_URL || 'https://api.hotkeys.ai') {
    this.platform = os.platform();
    this.deviceId = this.generateDeviceId();
    this.licenseServerUrl = licenseServerUrl;
  }

  /**
   * Generate unique device fingerprint
   */
  private generateDeviceId(): string {
    const cpus = os.cpus();
    const networkInterfaces = os.networkInterfaces();
    
    // Collect stable device characteristics
    const deviceData = {
      hostname: os.hostname(),
      platform: this.platform,
      arch: os.arch(),
      cpuModel: cpus[0]?.model || 'unknown',
      cpuCores: cpus.length,
      // Get first non-internal MAC address
      mac: Object.values(networkInterfaces)
        .flat()
        .find(iface => !iface?.internal && iface?.mac !== '00:00:00:00:00:00')?.mac || 'unknown'
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(deviceData))
      .digest('hex');
  }

  /**
   * Activate license with server
   */
  async activateLicense(licenseKey: string): Promise<License> {
    try {
      const response = await fetch(`${this.licenseServerUrl}/api/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          deviceId: this.deviceId,
          deviceInfo: {
            hostname: os.hostname(),
            platform: this.platform,
            arch: os.arch(),
            version: process.version
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'License activation failed');
      }

      const license = await response.json();
      
      // Store license locally (encrypted)
      await this.storeLicenseLocally(license);
      
      return license;
    } catch (error) {
      logger.error({ type: 'license_activation_error', error });
      throw error;
    }
  }

  /**
   * Detect installed AI coding tools
   */
  async detectInstalledTools(): Promise<Tool[]> {
    const tools: Tool[] = [];

    // VS Code detection
    const vscodeConfig = await this.detectVSCode();
    if (vscodeConfig) tools.push(vscodeConfig);

    // Cursor detection
    const cursorConfig = await this.detectCursor();
    if (cursorConfig) tools.push(cursorConfig);

    // JetBrains IDEs detection
    const jetbrainsConfigs = await this.detectJetBrains();
    tools.push(...jetbrainsConfigs);

    // Sublime Text detection
    const sublimeConfig = await this.detectSublime();
    if (sublimeConfig) tools.push(sublimeConfig);

    return tools;
  }

  private async detectVSCode(): Promise<Tool | null> {
    const configPaths = {
      darwin: path.join(os.homedir(), 'Library/Application Support/Code/User'),
      linux: path.join(os.homedir(), '.config/Code/User'),
      win32: path.join(process.env.APPDATA || '', 'Code/User')
    };

    const configPath = configPaths[this.platform as keyof typeof configPaths];
    if (!configPath) return null;

    try {
      await fs.access(configPath);
      return {
        name: 'Visual Studio Code',
        type: 'vscode',
        configPath: path.join(configPath, 'keybindings.json'),
        installed: true
      };
    } catch {
      return null;
    }
  }

  private async detectCursor(): Promise<Tool | null> {
    const configPaths = {
      darwin: path.join(os.homedir(), 'Library/Application Support/Cursor/User'),
      linux: path.join(os.homedir(), '.config/Cursor/User'),
      win32: path.join(process.env.APPDATA || '', 'Cursor/User')
    };

    const configPath = configPaths[this.platform as keyof typeof configPaths];
    if (!configPath) return null;

    try {
      await fs.access(configPath);
      return {
        name: 'Cursor',
        type: 'cursor',
        configPath: path.join(configPath, 'keybindings.json'),
        installed: true
      };
    } catch {
      return null;
    }
  }

  private async detectJetBrains(): Promise<Tool[]> {
    const tools: Tool[] = [];
    const jetbrainsProducts = ['IntelliJIdea', 'WebStorm', 'PyCharm', 'GoLand', 'RustRover'];
    
    const basePaths = {
      darwin: path.join(os.homedir(), 'Library/Application Support/JetBrains'),
      linux: path.join(os.homedir(), '.config/JetBrains'),
      win32: path.join(process.env.APPDATA || '', 'JetBrains')
    };

    const basePath = basePaths[this.platform as keyof typeof basePaths];
    if (!basePath) return tools;

    for (const product of jetbrainsProducts) {
      try {
        const productPath = path.join(basePath, product);
        const dirs = await fs.readdir(productPath);
        
        // Get the latest version directory
        const versionDir = dirs
          .filter(d => d.match(/^\d{4}\.\d/))
          .sort()
          .reverse()[0];

        if (versionDir) {
          tools.push({
            name: product,
            type: 'jetbrains',
            configPath: path.join(productPath, versionDir, 'keymaps'),
            installed: true,
            version: versionDir
          });
        }
      } catch {
        // Product not installed
      }
    }

    return tools;
  }

  private async detectSublime(): Promise<Tool | null> {
    const configPaths = {
      darwin: path.join(os.homedir(), 'Library/Application Support/Sublime Text/Packages/User'),
      linux: path.join(os.homedir(), '.config/sublime-text/Packages/User'),
      win32: path.join(process.env.APPDATA || '', 'Sublime Text/Packages/User')
    };

    const configPath = configPaths[this.platform as keyof typeof configPaths];
    if (!configPath) return null;

    try {
      await fs.access(configPath);
      return {
        name: 'Sublime Text',
        type: 'sublime',
        configPath: path.join(configPath, 'Default.sublime-keymap'),
        installed: true
      };
    } catch {
      return null;
    }
  }

  /**
   * Install hotkeys for a specific tool with creator attribution
   */
  async installHotkeys(tool: Tool, hotkeys: Hotkey[], license: License): Promise<void> {
    switch (tool.type) {
      case 'vscode':
      case 'cursor':
        await this.installVSCodeHotkeys(tool, hotkeys, license);
        break;
      case 'jetbrains':
        await this.installJetBrainsHotkeys(tool, hotkeys, license);
        break;
      case 'sublime':
        await this.installSublimeHotkeys(tool, hotkeys);
        break;
      default:
        logger.warn({ type: 'unsupported_tool', tool: tool.name });
    }
  }

  private async installVSCodeHotkeys(tool: Tool, hotkeys: Hotkey[], license: License): Promise<void> {
    try {
      // Read existing keybindings or create empty array
      let existingBindings: any[] = [];
      try {
        const content = await fs.readFile(tool.configPath, 'utf-8');
        existingBindings = JSON.parse(content);
      } catch {
        // File doesn't exist, will create new one
      }

      // Create backup
      if (existingBindings.length > 0) {
        const backupPath = `${tool.configPath}.backup.${Date.now()}`;
        await fs.writeFile(backupPath, JSON.stringify(existingBindings, null, 2));
      }

      // Group hotkeys by creator for better organization
      const creatorGroups = this.groupHotkeysByCreator(hotkeys);
      const newBindings = [...existingBindings];
      let totalConflictsResolved = 0;
      
      // Add creator attribution comments
      if (license.attribution_required) {
        newBindings.push({
          key: '', // Comment entry
          command: '',
          _comment: `// HotKeys.ai Installation - ${new Date().toLocaleString()}`,
          _source: 'hotkeys.ai'
        });
        
        for (const [creatorId, creatorHotkeys] of Object.entries(creatorGroups)) {
          const creator = license.creators.find(c => c.id === creatorId);
          if (creator) {
            newBindings.push({
              key: '', // Comment entry
              command: '',
              _comment: `// ${creator.name} (${creator.type === 'ai_agent' ? 'AI Agent' : 'Human Creator'}) - ${creatorHotkeys.length} hotkeys`,
              _creator: creator
            });
          }
        }
      }
      
      for (const hotkey of hotkeys) {
        // Remove any existing binding with the same key
        const existingIndex = newBindings.findIndex(b => b.key === hotkey.key && b.key !== '');
        if (existingIndex >= 0) {
          logger.info({ 
            type: 'hotkey_conflict_resolved',
            tool: tool.name,
            key: hotkey.key,
            oldCommand: newBindings[existingIndex].command,
            newCommand: hotkey.command,
            creator: hotkey.creator?.name
          });
          newBindings.splice(existingIndex, 1);
          totalConflictsResolved++;
        }

        // Add new binding with attribution
        newBindings.push({
          key: hotkey.key,
          command: hotkey.command,
          when: hotkey.when,
          args: hotkey.args,
          // Attribution metadata
          _source: 'hotkeys.ai',
          _id: hotkey.id,
          _creator: hotkey.creator?.name,
          _creatorType: hotkey.creator?.type,
          _creatorId: hotkey.creator?.id,
          _verified: hotkey.creator?.verified,
          _installedAt: new Date().toISOString(),
          _licenseKey: license.key
        });
      }
      
      // Track attribution in database
      await this.trackInstallationAttribution(tool, hotkeys, license, totalConflictsResolved);

      // Write updated keybindings
      await fs.mkdir(path.dirname(tool.configPath), { recursive: true });
      await fs.writeFile(tool.configPath, JSON.stringify(newBindings, null, 2));

      logger.info({
        type: 'hotkeys_installed',
        tool: tool.name,
        count: hotkeys.length
      });
    } catch (error) {
      logger.error({
        type: 'hotkey_installation_error',
        tool: tool.name,
        error
      });
      throw error;
    }
  }

  private async installJetBrainsHotkeys(tool: Tool, hotkeys: Hotkey[], license: License): Promise<void> {
    // JetBrains uses XML format for keymaps
    const creatorGroups = this.groupHotkeysByCreator(hotkeys);
    const attributionComments = Object.entries(creatorGroups).map(([creatorId, creatorHotkeys]) => {
      const creator = license.creators.find(c => c.id === creatorId);
      return creator ? `<!-- ${creator.name} (${creator.type === 'ai_agent' ? 'AI Agent' : 'Human'}) - ${creatorHotkeys.length} hotkeys -->` : '';
    }).join('\n');
    
    const keymapXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- HotKeys.ai Installation - ${new Date().toLocaleString()} -->
${attributionComments}
<keymap version="1" name="HotKeys.ai" parent="\$default">
${hotkeys.map(hk => `  <!-- ${hk.creator?.name || 'Unknown'} (${hk.creator?.type || 'unknown'}) -->
  <action id="${hk.command}">
    <keyboard-shortcut first-keystroke="${hk.key.replace(/\+/g, ' ')}"/>
  </action>`).join('\n')}
</keymap>`;

    const keymapPath = path.join(tool.configPath, 'HotKeys.ai.xml');
    await fs.mkdir(tool.configPath, { recursive: true });
    await fs.writeFile(keymapPath, keymapXml);

    // Track attribution
    await this.trackInstallationAttribution(tool, hotkeys, license, 0);

    logger.info({
      type: 'jetbrains_hotkeys_installed',
      tool: tool.name,
      path: keymapPath,
      creators: Object.keys(creatorGroups).length
    });
  }

  private async installSublimeHotkeys(tool: Tool, hotkeys: Hotkey[]): Promise<void> {
    // Sublime uses JSON format similar to VS Code
    let existingBindings: any[] = [];
    try {
      const content = await fs.readFile(tool.configPath, 'utf-8');
      existingBindings = JSON.parse(content);
    } catch {
      // File doesn't exist
    }

    const newBindings = [
      ...existingBindings,
      ...hotkeys.map(hk => ({
        keys: [hk.key],
        command: hk.command,
        args: hk.args,
        context: hk.when ? [{ key: hk.when }] : undefined
      }))
    ];

    await fs.mkdir(path.dirname(tool.configPath), { recursive: true });
    await fs.writeFile(tool.configPath, JSON.stringify(newBindings, null, 2));
  }

  /**
   * Store license locally for offline validation
   */
  private async storeLicenseLocally(license: License): Promise<void> {
    const licensePath = path.join(os.homedir(), '.hotkeys-ai', 'license.enc');
    
    // Encrypt license data
    const key = crypto.createHash('sha256').update(this.deviceId).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      iv,
      cipher.update(JSON.stringify(license)),
      cipher.final()
    ]);

    await fs.mkdir(path.dirname(licensePath), { recursive: true });
    await fs.writeFile(licensePath, encrypted);
  }

  /**
   * Verify local license
   */
  async verifyLocalLicense(): Promise<License | null> {
    try {
      const licensePath = path.join(os.homedir(), '.hotkeys-ai', 'license.enc');
      const encrypted = await fs.readFile(licensePath);
      
      const key = crypto.createHash('sha256').update(this.deviceId).digest();
      const iv = encrypted.slice(0, 16);
      const encryptedData = encrypted.slice(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
      ]);

      const license = JSON.parse(decrypted.toString());
      
      // Check expiration
      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        return null;
      }

      return license;
    } catch {
      return null;
    }
  }

  /**
   * Main installation flow
   */
  async install(licenseKey: string): Promise<{
    success: boolean;
    installedTools: string[];
    errors: string[];
  }> {
    const installedTools: string[] = [];
    const errors: string[] = [];

    try {
      // Activate license
      logger.info({ type: 'installation_started', deviceId: this.deviceId });
      const license = await this.activateLicense(licenseKey);
      
      // Detect tools
      const tools = await this.detectInstalledTools();
      
      if (tools.length === 0) {
        return {
          success: false,
          installedTools: [],
          errors: ['No supported AI coding tools detected']
        };
      }

      // Install hotkeys for each tool
      for (const tool of tools) {
        try {
          await this.installHotkeys(tool, license.hotkeys, license);
          installedTools.push(tool.name);
        } catch (error) {
          errors.push(`Failed to install hotkeys for ${tool.name}: ${error}`);
        }
      }

      logger.info({
        type: 'installation_completed',
        installedTools,
        errors
      });

      return {
        success: installedTools.length > 0,
        installedTools,
        errors
      };
    } catch (error) {
      logger.error({ type: 'installation_failed', error });
      return {
        success: false,
        installedTools: [],
        errors: [`Installation failed: ${error}`]
      };
    }
  }

  /**
   * Group hotkeys by creator for better organization
   */
  private groupHotkeysByCreator(hotkeys: Hotkey[]): { [creatorName: string]: Hotkey[] } {
    const groups: { [creatorName: string]: Hotkey[] } = {};
    
    for (const hotkey of hotkeys) {
      const creatorName = hotkey.creator?.name || 'Unknown';
      if (!groups[creatorName]) {
        groups[creatorName] = [];
      }
      groups[creatorName].push(hotkey);
    }
    
    return groups;
  }

  /**
   * Track installation attribution in database
   */
  private async trackInstallationAttribution(
    tool: Tool, 
    hotkeys: Hotkey[], 
    license: License, 
    conflictsResolved: number
  ): Promise<void> {
    try {
      // Track installation analytics
      logger.info({
        type: 'hotkey_installation_tracked',
        toolType: tool.type,
        toolPath: tool.configPath,
        hotkeyCount: hotkeys.length,
        licenseKey: license.key,
        conflictsResolved,
        attribution: license.attribution_required
      });
      
      // This would send to analytics API in a real implementation
      // For now, just log the attribution tracking
    } catch (error) {
      logger.warn({
        type: 'attribution_tracking_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
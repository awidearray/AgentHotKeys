import { z } from 'zod';

export interface SecurityValidationResult {
  score: number; // 0-100
  passed: boolean;
  findings: SecurityFinding[];
}

export interface SecurityFinding {
  severity: 'info' | 'warning' | 'critical';
  category: string;
  message: string;
  line?: number;
  file?: string;
}

const DANGEROUS_PATTERNS = [
  { pattern: /eval\s*\(/, severity: 'critical', message: 'Use of eval() detected' },
  { pattern: /exec\s*\(/, severity: 'critical', message: 'Use of exec() detected' },
  { pattern: /rm\s+-rf/, severity: 'critical', message: 'Dangerous rm command detected' },
  { pattern: /process\.env/, severity: 'warning', message: 'Environment variable access' },
  { pattern: /require\s*\(['"]child_process['"]/, severity: 'critical', message: 'Child process execution' },
  { pattern: /\.writeFileSync/, severity: 'warning', message: 'File system write operation' },
  { pattern: /\.unlinkSync/, severity: 'warning', message: 'File deletion operation' },
  { pattern: /crypto\s*\./, severity: 'info', message: 'Cryptographic operation' },
  { pattern: /api[_\-]?key/i, severity: 'critical', message: 'Potential API key exposure' },
  { pattern: /password\s*=\s*['"]/, severity: 'critical', message: 'Hard-coded password detected' },
  { pattern: /secret\s*=\s*['"]/, severity: 'critical', message: 'Hard-coded secret detected' },
  { pattern: /\$\{.*\}/, severity: 'info', message: 'Template literal with interpolation' },
  { pattern: /fetch\s*\(/, severity: 'info', message: 'External network request' },
  { pattern: /axios\s*\./, severity: 'info', message: 'External network request via axios' },
  { pattern: /localStorage/, severity: 'info', message: 'Local storage access' },
  { pattern: /document\.cookie/, severity: 'warning', message: 'Cookie access detected' },
];

const ALLOWED_COMMANDS = [
  'ls', 'cd', 'pwd', 'echo', 'cat', 'grep', 'find', 'which',
  'npm', 'yarn', 'pnpm', 'git', 'node', 'python', 'pip',
  'test', 'lint', 'build', 'dev', 'start',
];

export async function validateHotkeyContent(content: any): Promise<SecurityValidationResult> {
  const findings: SecurityFinding[] = [];
  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  try {
    const contentString = JSON.stringify(content);
    
    for (const check of DANGEROUS_PATTERNS) {
      if (check.pattern.test(contentString)) {
        const finding: SecurityFinding = {
          severity: check.severity as 'info' | 'warning' | 'critical',
          category: 'pattern_match',
          message: check.message,
        };
        findings.push(finding);
        
        switch (check.severity) {
          case 'critical':
            criticalCount++;
            break;
          case 'warning':
            warningCount++;
            break;
          case 'info':
            infoCount++;
            break;
        }
      }
    }

    if (content.command) {
      const commandParts = content.command.split(/\s+/);
      const baseCommand = commandParts[0];
      
      if (!ALLOWED_COMMANDS.includes(baseCommand)) {
        findings.push({
          severity: 'warning',
          category: 'command',
          message: `Potentially unsafe command: ${baseCommand}`,
        });
        warningCount++;
      }

      if (commandParts.some((part: string) => part.includes('sudo'))) {
        findings.push({
          severity: 'critical',
          category: 'privilege',
          message: 'Sudo/elevated privileges requested',
        });
        criticalCount++;
      }

      if (commandParts.some((part: string) => part.includes('/etc/') || part.includes('/sys/'))) {
        findings.push({
          severity: 'critical',
          category: 'system_access',
          message: 'Access to system directories detected',
        });
        criticalCount++;
      }
    }

    if (content.keybinding) {
      const binding = content.keybinding.toLowerCase();
      if (binding.includes('cmd+q') || binding.includes('ctrl+q') || 
          binding.includes('alt+f4')) {
        findings.push({
          severity: 'warning',
          category: 'keybinding',
          message: 'Keybinding conflicts with system shortcuts',
        });
        warningCount++;
      }
    }

    const score = Math.max(0, 100 - (criticalCount * 30) - (warningCount * 10) - (infoCount * 2));
    const passed = criticalCount === 0 && score >= 60;

    return {
      score,
      passed,
      findings,
    };
  } catch (error) {
    return {
      score: 0,
      passed: false,
      findings: [{
        severity: 'critical',
        category: 'validation_error',
        message: 'Failed to validate content',
      }],
    };
  }
}

export async function validateHotkeyBatch(hotkeys: any[]): Promise<Map<string, SecurityValidationResult>> {
  const results = new Map<string, SecurityValidationResult>();
  
  for (const hotkey of hotkeys) {
    const result = await validateHotkeyContent(hotkey.content);
    results.set(hotkey.id, result);
  }
  
  return results;
}

export function generateSecurityReport(result: SecurityValidationResult): string {
  const sections = [];
  
  sections.push(`Security Score: ${result.score}/100`);
  sections.push(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
  
  if (result.findings.length > 0) {
    sections.push('\nFindings:');
    
    const grouped = result.findings.reduce((acc, finding) => {
      if (!acc[finding.severity]) {
        acc[finding.severity] = [];
      }
      acc[finding.severity].push(finding);
      return acc;
    }, {} as Record<string, SecurityFinding[]>);
    
    for (const [severity, items] of Object.entries(grouped)) {
      sections.push(`\n${severity.toUpperCase()}:`);
      for (const item of items) {
        sections.push(`  - ${item.message}`);
      }
    }
  }
  
  return sections.join('\n');
}
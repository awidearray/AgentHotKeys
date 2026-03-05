import { z } from 'zod';

// Security validation for hotkey content
export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100, higher is better
}

// Dangerous patterns that should be blocked
const DANGEROUS_PATTERNS = [
  /rm\s+-rf/gi, // Dangerous file deletion
  /sudo\s+/gi, // Privilege escalation
  /curl.*\|\s*sh/gi, // Piping to shell
  /wget.*\|\s*sh/gi, // Piping to shell
  /eval\s*\(/gi, // Code evaluation
  /exec\s*\(/gi, // Code execution
  /system\s*\(/gi, // System calls
  /powershell/gi, // PowerShell execution
  /cmd\.exe/gi, // Command prompt
  /\/dev\/null/gi, // File redirection
  />\s*\/etc/gi, // Writing to system directories
  /chmod\s+777/gi, // Dangerous permissions
  /passwd/gi, // Password manipulation
  /shadow/gi, // Shadow file access
];

// Suspicious patterns that should generate warnings
const SUSPICIOUS_PATTERNS = [
  /password/gi,
  /secret/gi,
  /token/gi,
  /api[_-]?key/gi,
  /private[_-]?key/gi,
  /credential/gi,
  /auth/gi,
  /login/gi,
  /session/gi,
  /cookie/gi,
];

// Required safety elements
const SAFETY_INDICATORS = [
  /validate/gi,
  /check/gi,
  /verify/gi,
  /test/gi,
  /safe/gi,
  /error/gi,
  /exception/gi,
];

export function validateHotkeyContent(content: {
  title: string;
  description: string;
  keybinding: string;
  command: string;
  instructions?: string;
}): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Combine all text content for analysis
  const allText = [
    content.title,
    content.description,
    content.command,
    content.instructions || ''
  ].join(' ').toLowerCase();

  // Check for dangerous patterns
  DANGEROUS_PATTERNS.forEach((pattern) => {
    if (pattern.test(allText)) {
      errors.push(`Dangerous command pattern detected: ${pattern.source}`);
      score -= 30;
    }
  });

  // Check for suspicious patterns
  SUSPICIOUS_PATTERNS.forEach((pattern) => {
    if (pattern.test(allText)) {
      warnings.push(`Potentially sensitive content detected: ${pattern.source.replace(/[gi]/g, '')}`);
      score -= 5;
    }
  });

  // Check for safety indicators (bonus points)
  const safetyCount = SAFETY_INDICATORS.filter(pattern => pattern.test(allText)).length;
  if (safetyCount > 0) {
    score += safetyCount * 2; // Bonus for safety
  }

  // Validate command structure
  if (content.command.length < 3) {
    errors.push('Command is too short to be meaningful');
    score -= 10;
  }

  if (content.command.includes('..')) {
    warnings.push('Command contains directory traversal patterns');
    score -= 10;
  }

  // Check keybinding format
  const validKeybindingPattern = /^(Ctrl|Cmd|Alt|Shift)(\+[A-Za-z0-9])+$/;
  if (!validKeybindingPattern.test(content.keybinding.replace(/\s/g, ''))) {
    warnings.push('Keybinding format may not be standard');
    score -= 5;
  }

  // Content quality checks
  if (content.description.length < 20) {
    warnings.push('Description is very short - consider adding more detail');
    score -= 5;
  }

  if (content.title.length > 100) {
    warnings.push('Title is very long - consider shortening');
    score -= 5;
  }

  // Final score adjustment
  score = Math.max(0, Math.min(100, score));

  return {
    isValid: errors.length === 0 && score >= 60,
    errors,
    warnings,
    score
  };
}

// Enhanced validation schema for hotkey creation with security checks
export const SecureHotkeySchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .refine(
      (title) => !DANGEROUS_PATTERNS.some(pattern => pattern.test(title)),
      'Title contains dangerous content'
    ),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .refine(
      (desc) => !DANGEROUS_PATTERNS.some(pattern => pattern.test(desc)),
      'Description contains dangerous content'
    ),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string())
    .min(1, 'At least one tag is required')
    .max(5, 'Maximum 5 tags allowed')
    .refine(
      (tags) => tags.every(tag => !DANGEROUS_PATTERNS.some(pattern => pattern.test(tag))),
      'Tags contain dangerous content'
    ),
  price_usd: z.number().min(0).max(1000),
  is_free: z.boolean(),
  content: z.object({
    keybinding: z.string()
      .min(1, 'Keybinding is required')
      .refine(
        (kb) => /^[A-Za-z0-9+\-\s]+$/.test(kb),
        'Keybinding contains invalid characters'
      ),
    command: z.string()
      .min(1, 'Command is required')
      .refine(
        (cmd) => !DANGEROUS_PATTERNS.some(pattern => pattern.test(cmd)),
        'Command contains dangerous patterns'
      ),
    description: z.string(),
    compatibility: z.array(z.string()).min(1, 'At least one compatible editor required'),
    instructions: z.string().optional()
      .refine(
        (inst) => !inst || !DANGEROUS_PATTERNS.some(pattern => pattern.test(inst)),
        'Instructions contain dangerous content'
      ),
  }),
}).refine(
  (data) => {
    const validation = validateHotkeyContent({
      title: data.title,
      description: data.description,
      keybinding: data.content.keybinding,
      command: data.content.command,
      instructions: data.content.instructions,
    });
    return validation.isValid;
  },
  {
    message: 'Hotkey failed security validation',
    path: ['security']
  }
);

export type SecureHotkeyData = z.infer<typeof SecureHotkeySchema>;

// Function to generate a security report for admin review
export function generateSecurityReport(
  hotkey: SecureHotkeyData,
  validation: SecurityValidationResult
): string {
  const report = [
    `Security Validation Report`,
    `========================`,
    `Hotkey: ${hotkey.title}`,
    `Score: ${validation.score}/100`,
    `Status: ${validation.isValid ? 'PASS' : 'FAIL'}`,
    ``,
    `Errors (${validation.errors.length}):`,
    ...validation.errors.map(e => `  - ${e}`),
    ``,
    `Warnings (${validation.warnings.length}):`,
    ...validation.warnings.map(w => `  - ${w}`),
    ``,
    `Content Analysis:`,
    `  Title: ${hotkey.title}`,
    `  Command: ${hotkey.content.command}`,
    `  Keybinding: ${hotkey.content.keybinding}`,
    `  Category: ${hotkey.category}`,
    `  Tags: ${hotkey.tags.join(', ')}`,
    ``,
    `Recommendation: ${validation.isValid ? 'APPROVE' : 'REJECT'}`,
    `Generated: ${new Date().toISOString()}`,
  ].join('\n');

  return report;
}
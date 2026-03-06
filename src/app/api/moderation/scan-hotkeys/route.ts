import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import { validateRequest } from '@/lib/validation';
import { AuthenticationError, ValidationError, handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';
import { z } from 'zod';

const scanRequestSchema = z.object({
  hotkey_pack_id: z.string().uuid(),
  creator_id: z.string().uuid(),
  hotkeys: z.array(z.object({
    key_combination: z.string(),
    command: z.string(),
    description: z.string().optional(),
    context: z.string().optional()
  })).min(1).max(100)
});

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'malicious_command' | 'privilege_escalation' | 'file_access' | 'network_access' | 'script_injection' | 'suspicious_pattern';
  description: string;
  hotkey_index: number;
  recommendation: string;
}

/**
 * Hotkey Security Scanner API
 * Scans hotkey configurations for malicious patterns before marketplace approval
 */
export async function POST(request: NextRequest) {
  try {
    await rateLimiters.api(request);

    // Admin authentication for security scanning
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Admin token required');
    }

    const token = authHeader.substring(7);
    if (token !== process.env.ADMIN_SECRET_TOKEN) {
      throw new AuthenticationError('Invalid admin token');
    }

    const body = await request.json();
    const data = await validateRequest(scanRequestSchema, body);

    logger.info({
      type: 'security_scan_started',
      hotkeyPackId: data.hotkey_pack_id,
      creatorId: data.creator_id,
      hotkeyCount: data.hotkeys.length
    });

    // Verify pack ownership
    const packResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('hotkey_packs')
        .select('*')
        .eq('id', data.hotkey_pack_id)
        .eq('creator_id', data.creator_id)
        .single()
    );

    if (!packResult.success || !packResult.data) {
      throw new ValidationError('Hotkey pack not found or access denied');
    }

    const pack = packResult.data;

    // Perform security scanning
    const securityIssues: SecurityIssue[] = [];
    const scanResults = await scanHotkeysSecurity(data.hotkeys);
    
    securityIssues.push(...scanResults.issues);

    // Calculate security score (0-100)
    const securityScore = calculateSecurityScore(securityIssues);
    const approved = securityScore >= 70 && !securityIssues.some(issue => issue.severity === 'critical');

    // Update pack with scan results
    const updateResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('hotkey_packs')
        .update({
          security_scan_completed: true,
          security_score: securityScore,
          scan_issues: securityIssues,
          approved: approved,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', data.hotkey_pack_id)
    );

    // Log security scan result
    await safeDbOperation(async () =>
      await supabaseAdmin
        .from('security_scan_logs')
        .insert({
          hotkey_pack_id: data.hotkey_pack_id,
          creator_id: data.creator_id,
          security_score: securityScore,
          issues_found: securityIssues.length,
          critical_issues: securityIssues.filter(i => i.severity === 'critical').length,
          approved: approved,
          scan_metadata: {
            total_hotkeys: data.hotkeys.length,
            scan_version: '1.0',
            patterns_checked: scanResults.patternsChecked
          }
        })
    );

    logger.info({
      type: 'security_scan_completed',
      hotkeyPackId: data.hotkey_pack_id,
      securityScore,
      issuesFound: securityIssues.length,
      approved
    });

    return NextResponse.json({
      success: true,
      scan_completed: true,
      security_score: securityScore,
      approved: approved,
      issues: securityIssues,
      recommendations: generateRecommendations(securityIssues),
      next_steps: approved ? 
        'Hotkey pack approved for marketplace' : 
        'Review and fix security issues before resubmission'
    });

  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/moderation/scan-hotkeys'
    });
  }
}

/**
 * Scan hotkeys for security vulnerabilities
 */
async function scanHotkeysSecurity(hotkeys: any[]): Promise<{
  issues: SecurityIssue[],
  patternsChecked: string[]
}> {
  const issues: SecurityIssue[] = [];
  const patternsChecked = [
    'malicious_commands',
    'file_system_access', 
    'network_operations',
    'privilege_escalation',
    'script_injection',
    'suspicious_patterns'
  ];

  for (let i = 0; i < hotkeys.length; i++) {
    const hotkey = hotkeys[i];
    const command = hotkey.command.toLowerCase();
    const description = (hotkey.description || '').toLowerCase();

    // Check for malicious commands
    const maliciousPatterns = [
      'rm -rf', 'del /f', 'format c:', 'sudo rm', 'dd if=', 'kill -9',
      'shutdown', 'reboot', 'halt', 'poweroff', 'init 0', 'init 6',
      'chmod 777', 'chown root', 'passwd', 'useradd', 'userdel',
      'crontab', 'at ', 'batch', 'nohup'
    ];

    for (const pattern of maliciousPatterns) {
      if (command.includes(pattern) || description.includes(pattern)) {
        issues.push({
          severity: 'critical',
          type: 'malicious_command',
          description: `Potentially destructive command detected: ${pattern}`,
          hotkey_index: i,
          recommendation: 'Remove or replace with safer alternative'
        });
      }
    }

    // Check for privilege escalation
    const privilegePatterns = ['sudo', 'su -', 'runas', 'admin', 'root', 'administrator'];
    
    for (const pattern of privilegePatterns) {
      if (command.includes(pattern)) {
        issues.push({
          severity: 'high',
          type: 'privilege_escalation',
          description: `Privilege escalation detected: ${pattern}`,
          hotkey_index: i,
          recommendation: 'Avoid commands requiring elevated privileges'
        });
      }
    }

    // Check for suspicious file access
    const filePatterns = [
      '/etc/', 'c:\\windows\\', '/bin/', '/sbin/', '/usr/bin/',
      'system32', 'registry', 'regedit', '/home/', 'documents',
      '../', '.ssh/', '.aws/', 'id_rsa', 'private'
    ];

    for (const pattern of filePatterns) {
      if (command.includes(pattern) || description.includes(pattern)) {
        issues.push({
          severity: 'medium',
          type: 'file_access',
          description: `Suspicious file system access: ${pattern}`,
          hotkey_index: i,
          recommendation: 'Limit file access to necessary directories only'
        });
      }
    }

    // Check for network operations
    const networkPatterns = [
      'wget', 'curl', 'nc ', 'netcat', 'ssh ', 'scp ', 'rsync',
      'http://', 'https://', 'ftp://', 'telnet', 'ping -c 1000'
    ];

    for (const pattern of networkPatterns) {
      if (command.includes(pattern)) {
        issues.push({
          severity: 'medium',
          type: 'network_access',
          description: `Network operation detected: ${pattern}`,
          hotkey_index: i,
          recommendation: 'Ensure network operations are necessary and secure'
        });
      }
    }

    // Check for script injection
    const injectionPatterns = [
      '$(', '`', '|', '&&', '||', ';', 'eval', 'exec',
      '<script', 'javascript:', 'vbscript:', 'data:'
    ];

    for (const pattern of injectionPatterns) {
      if (command.includes(pattern)) {
        issues.push({
          severity: 'high',
          type: 'script_injection',
          description: `Script injection pattern detected: ${pattern}`,
          hotkey_index: i,
          recommendation: 'Avoid dynamic command execution patterns'
        });
      }
    }

    // Check for suspicious patterns
    if (command.length > 500) {
      issues.push({
        severity: 'medium',
        type: 'suspicious_pattern',
        description: 'Unusually long command detected',
        hotkey_index: i,
        recommendation: 'Break down complex commands into simpler parts'
      });
    }

    if (/[^\x20-\x7E]/.test(command)) {
      issues.push({
        severity: 'high',
        type: 'suspicious_pattern',
        description: 'Non-printable characters detected in command',
        hotkey_index: i,
        recommendation: 'Remove non-standard characters from command'
      });
    }
  }

  return { issues, patternsChecked };
}

/**
 * Calculate security score based on issues found
 */
function calculateSecurityScore(issues: SecurityIssue[]): number {
  let score = 100;
  
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 25;
        break;
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 8;
        break;
      case 'low':
        score -= 3;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate recommendations based on issues found
 */
function generateRecommendations(issues: SecurityIssue[]): string[] {
  const recommendations = [];
  
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');
  
  if (criticalIssues.length > 0) {
    recommendations.push('CRITICAL: Remove all destructive commands before resubmission');
  }
  
  if (highIssues.length > 0) {
    recommendations.push('HIGH: Review privilege escalation and injection patterns');
  }
  
  if (issues.length > 0) {
    recommendations.push('Review all flagged hotkeys and their security implications');
    recommendations.push('Test hotkeys in isolated environment before marketplace publication');
    recommendations.push('Consider providing clearer descriptions for complex commands');
  }
  
  if (issues.length === 0) {
    recommendations.push('Hotkey pack passed all security checks');
  }
  
  return recommendations;
}
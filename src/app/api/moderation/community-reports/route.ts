import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import { validateRequest } from '@/lib/validation';
import { AuthenticationError, ValidationError, handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';
import { z } from 'zod';

const reportSchema = z.object({
  hotkey_pack_id: z.string().uuid(),
  reporter_user_id: z.string().uuid(),
  report_type: z.enum(['malicious_code', 'copyright_violation', 'spam', 'inappropriate_content', 'security_vulnerability', 'other']),
  description: z.string().min(10).max(1000),
  evidence: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
});

const reviewSchema = z.object({
  report_id: z.string().uuid(),
  action: z.enum(['approved', 'rejected', 'requires_action']),
  admin_notes: z.string().optional(),
  pack_action: z.enum(['none', 'suspend', 'remove', 'warn_creator']).optional()
});

/**
 * Community Reporting System API
 * Handles user reports of suspicious or malicious hotkey packs
 */

/**
 * Submit a community report
 */
export async function POST(request: NextRequest) {
  try {
    await rateLimiters.api(request);

    const body = await request.json();
    const data = await validateRequest(reportSchema, body);

    // Verify the hotkey pack exists
    const packResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('hotkey_packs')
        .select('id, name, creator_id, approved')
        .eq('id', data.hotkey_pack_id)
        .single()
    );

    if (!packResult.success || !packResult.data) {
      throw new ValidationError('Hotkey pack not found');
    }

    const pack = packResult.data as any;

    // Verify reporter exists and isn't the creator
    const reporterResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('users')
        .select('id, name, role')
        .eq('id', data.reporter_user_id)
        .single()
    );

    if (!reporterResult.success || !reporterResult.data) {
      throw new ValidationError('Invalid reporter user');
    }

    if (data.reporter_user_id === pack.creator_id) {
      throw new ValidationError('Cannot report your own hotkey pack');
    }

    // Check for duplicate reports
    const existingReportResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('community_reports')
        .select('id')
        .eq('hotkey_pack_id', data.hotkey_pack_id)
        .eq('reporter_user_id', data.reporter_user_id)
        .eq('status', 'pending')
        .single()
    );

    if (existingReportResult.success && existingReportResult.data) {
      throw new ValidationError('You have already reported this hotkey pack');
    }

    // Create the report
    const reportResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('community_reports')
        .insert({
          hotkey_pack_id: data.hotkey_pack_id,
          reporter_user_id: data.reporter_user_id,
          report_type: data.report_type,
          description: data.description,
          evidence: data.evidence,
          severity: data.severity,
          status: 'pending',
          metadata: {
            pack_name: pack.name,
            pack_approved: pack.approved,
            reporter_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent')
          }
        })
        .select()
        .single()
    );

    if (!reportResult.success || !reportResult.data) {
      throw new Error('Failed to create report');
    }

    // Auto-flag pack if severity is critical
    if (data.severity === 'critical') {
      await safeDbOperation(async () =>
        await supabaseAdmin
          .from('hotkey_packs')
          .update({ 
            flagged: true, 
            flagged_reason: `Critical community report: ${data.report_type}`,
            flagged_at: new Date().toISOString()
          })
          .eq('id', data.hotkey_pack_id)
      );
    }

    // Notify moderators for high/critical reports
    if (data.severity === 'high' || data.severity === 'critical') {
      await notifyModerators(reportResult.data, pack);
    }

    logger.info({
      type: 'community_report_submitted',
      reportId: (reportResult.data as any).id,
      hotkeyPackId: data.hotkey_pack_id,
      reportType: data.report_type,
      severity: data.severity,
      reporterUserId: data.reporter_user_id
    });

    return NextResponse.json({
      success: true,
      report_id: (reportResult.data as any).id,
      message: 'Report submitted successfully',
      status: 'under_review',
      estimated_review_time: data.severity === 'critical' ? '24 hours' : '3-5 business days'
    });

  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/moderation/community-reports'
    });
  }
}

/**
 * Get community reports (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await rateLimiters.api(request);

    // Admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Admin token required');
    }

    const token = authHeader.substring(7);
    if (token !== process.env.ADMIN_SECRET_TOKEN) {
      throw new AuthenticationError('Invalid admin token');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const severity = searchParams.get('severity');
    const reportType = searchParams.get('report_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let query = supabaseAdmin
      .from('community_reports')
      .select(`
        *,
        hotkey_packs!inner(id, name, creator_id, creator_name),
        users!reporter_user_id(id, name, email)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    const reportsResult = await safeDbOperation(async () => query);

    if (!reportsResult.success) {
      throw new Error('Failed to fetch reports');
    }

    const reports = reportsResult.data || [];

    // Get summary statistics
    const statsResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .rpc('get_moderation_stats')
    );

    const stats = statsResult.success ? statsResult.data : null;

    return NextResponse.json({
      success: true,
      reports,
      summary: {
        total_reports: reports.length,
        pending_reports: stats?.pending_reports || 0,
        resolved_today: stats?.resolved_today || 0,
        critical_reports: stats?.critical_reports || 0
      }
    });

  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/moderation/community-reports [GET]'
    });
  }
}

/**
 * Review and take action on a report (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    await rateLimiters.strict(request);

    // Admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Admin token required');
    }

    const token = authHeader.substring(7);
    if (token !== process.env.ADMIN_SECRET_TOKEN) {
      throw new AuthenticationError('Invalid admin token');
    }

    const body = await request.json();
    const data = await validateRequest(reviewSchema, body);

    // Get the report
    const reportResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('community_reports')
        .select(`
          *,
          hotkey_packs!inner(id, name, creator_id)
        `)
        .eq('id', data.report_id)
        .single()
    );

    if (!reportResult.success || !reportResult.data) {
      throw new ValidationError('Report not found');
    }

    const report = reportResult.data as any;

    // Update report status
    const updateResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('community_reports')
        .update({
          status: data.action === 'approved' ? 'resolved' : data.action === 'rejected' ? 'dismissed' : 'in_progress',
          admin_notes: data.admin_notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin' // In real implementation, get from JWT
        })
        .eq('id', data.report_id)
    );

    // Take action on the hotkey pack if required
    if (data.pack_action && data.pack_action !== 'none') {
      await takePackAction(report.hotkey_packs.id, data.pack_action, report);
    }

    logger.info({
      type: 'community_report_reviewed',
      reportId: data.report_id,
      action: data.action,
      packAction: data.pack_action,
      hotkeyPackId: report.hotkey_pack_id
    });

    return NextResponse.json({
      success: true,
      message: `Report ${data.action}`,
      actions_taken: data.pack_action !== 'none' ? [data.pack_action] : []
    });

  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/moderation/community-reports [PUT]'
    });
  }
}

/**
 * Take action on a hotkey pack based on moderation decision
 */
async function takePackAction(packId: string, action: string, report: any): Promise<void> {
  switch (action) {
    case 'suspend':
      await supabaseAdmin
        .from('hotkey_packs')
        .update({
          suspended: true,
          suspended_reason: `Community report: ${report.report_type}`,
          suspended_at: new Date().toISOString()
        })
        .eq('id', packId);
      break;

    case 'remove':
      await supabaseAdmin
        .from('hotkey_packs')
        .update({
          deleted: true,
          deleted_reason: `Community report: ${report.report_type}`,
          deleted_at: new Date().toISOString()
        })
        .eq('id', packId);
      break;

    case 'warn_creator':
      await supabaseAdmin
        .from('creator_warnings')
        .insert({
          creator_id: report.hotkey_packs.creator_id,
          warning_type: 'community_report',
          description: `Warning due to community report: ${report.description}`,
          report_id: report.id
        });
      break;
  }
}

/**
 * Notify moderators of high-priority reports
 */
async function notifyModerators(report: any, pack: any): Promise<void> {
  try {
    // In a real implementation, this would send notifications via email, Slack, etc.
    logger.warn({
      type: 'high_priority_community_report',
      reportId: report.id,
      hotkeyPackId: pack.id,
      packName: pack.name,
      reportType: report.report_type,
      severity: report.severity,
      description: report.description
    });

    // Could integrate with notification services:
    // await sendSlackAlert(report, pack);
    // await sendEmailAlert(report, pack);
  } catch (error) {
    logger.error({
      type: 'moderator_notification_failed',
      reportId: report.id,
      error
    });
  }
}
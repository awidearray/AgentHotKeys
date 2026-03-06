import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import { validateRequest } from '@/lib/validation';
import { ValidationError, handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const installationAnalyticsSchema = z.object({
  creatorId: z.string().uuid(),
  creatorType: z.enum(['human', 'ai_agent']),
  deviceId: z.string().min(32),
  toolName: z.string(),
  hotkeyCount: z.number().int().min(1),
  conflictsResolved: z.number().int().min(0).default(0),
  licenseKey: z.string(),
  installationMethod: z.enum(['auto', 'manual', 'api']).default('auto')
});

/**
 * Installation Analytics Endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await validateRequest(installationAnalyticsSchema, body);
    
    const licenseResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('licenses')
        .select(`
          id, 
          user_id, 
          creator_id,
          license_activations!inner(id, device_id)
        `)
        .eq('key', data.licenseKey)
        .eq('license_activations.device_id', data.deviceId)
        .single()
    );
    
    if (!licenseResult.success || !licenseResult.data) {
      throw new ValidationError('Invalid license or device not activated');
    }
    
    const license = licenseResult.data as any;
    const activation = license.license_activations;
    
    const attributionResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('installation_attributions')
        .insert({
          activation_id: activation.id,
          creator_id: data.creatorId,
          creator_type: data.creatorType,
          device_id: data.deviceId,
          installation_method: data.installationMethod,
          conflicts_resolved: data.conflictsResolved,
          attribution_comment: `${data.toolName}: ${data.hotkeyCount} hotkeys by ${data.creatorType === 'ai_agent' ? 'AI Agent' : 'Human Creator'}`,
          source_info: {
            tool_name: data.toolName,
            hotkey_count: data.hotkeyCount,
            installation_timestamp: new Date().toISOString(),
            user_agent: request.headers.get('user-agent')
          }
        })
    );
    
    if (!attributionResult.success) {
      logger.warn({
        type: 'attribution_recording_failed',
        error: attributionResult.error,
        data
      });
    }
    
    await updateCreatorAnalytics(data.creatorId, data.hotkeyCount);
    
    await safeDbOperation(async () =>
      await supabaseAdmin
        .from('license_usage')
        .insert({
          activation_id: activation.id,
          action: 'hotkey_installation',
          metadata: {
            creator_id: data.creatorId,
            tool_name: data.toolName,
            hotkey_count: data.hotkeyCount,
            conflicts_resolved: data.conflictsResolved
          }
        })
    );
    
    logger.info({
      type: 'installation_tracked',
      creatorId: data.creatorId,
      creatorType: data.creatorType,
      toolName: data.toolName,
      hotkeyCount: data.hotkeyCount,
      deviceId: data.deviceId.substring(0, 8) + '...'
    });
    
    return NextResponse.json({
      success: true,
      attribution_recorded: attributionResult.success,
      message: 'Installation analytics recorded'
    });
    
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/installation'
    });
  }
}

async function updateCreatorAnalytics(creatorId: string, hotkeyCount: number): Promise<void> {
  try {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const analyticsResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .rpc('upsert_creator_analytics', {
          p_creator_id: creatorId,
          p_period_start: periodStart.toISOString(),
          p_period_end: periodEnd.toISOString(),
          p_installations_increment: 1,
          p_hotkey_count_increment: hotkeyCount
        })
    );
    
    if (!analyticsResult.success) {
      logger.warn({
        type: 'creator_analytics_update_failed',
        creatorId,
        error: analyticsResult.error
      });
    }
  } catch (error) {
    logger.warn({
      type: 'creator_analytics_error',
      creatorId,
      error
    });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import { validateRequest } from '@/lib/validation';
import { ConflictError, handleApiError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';
import { z } from 'zod';

const activationSchema = z.object({
  licenseKey: z.string().min(1, 'License key required'),
  deviceId: z.string().min(32, 'Invalid device ID'),
  deviceInfo: z.object({
    hostname: z.string(),
    platform: z.string(),
    arch: z.string(),
    version: z.string()
  })
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    await rateLimiters.strict(request);
    
    // Validate request
    const body = await request.json();
    const data = await validateRequest(activationSchema, body);
    
    logger.info({
      type: 'license_activation_attempt',
      deviceId: data.deviceId,
      platform: data.deviceInfo.platform
    });
    
    // Find license
    const licenseResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('licenses')
        .select('*')
        .eq('key', data.licenseKey)
        .single()
    );
    
    if (!licenseResult.success || !licenseResult.data) {
      throw new ValidationError('Invalid license key');
    }
    
    const license = licenseResult.data as any;
    
    // Check if license is valid
    if (license.revoked) {
      throw new ValidationError('License has been revoked');
    }
    
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      throw new ValidationError('License has expired');
    }
    
    // Check device limit
    const activationsResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('license_activations')
        .select('*')
        .eq('license_id', license.id)
        .eq('active', true)
    );
    
    if (activationsResult.success && activationsResult.data) {
      const activeDevices = activationsResult.data.filter(a => a.device_id !== data.deviceId);
      
      if (activeDevices.length >= (license.max_devices || 1)) {
        throw new ConflictError('Device limit reached for this license');
      }
    }
    
    // Check if this device is already activated
    const existingActivation = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('license_activations')
        .select('*')
        .eq('license_id', license.id)
        .eq('device_id', data.deviceId)
        .single()
    );
    
    let activation;
    
    if (existingActivation.success && existingActivation.data) {
      // Update existing activation
      const updateResult = await safeDbOperation(async () =>
        await supabaseAdmin
          .from('license_activations')
          .update({
            active: true,
            last_seen: new Date().toISOString(),
            device_info: data.deviceInfo
          })
          .eq('id', (existingActivation.data as any).id)
          .select()
          .single()
      );
      
      activation = updateResult.data as any;
    } else {
      // Create new activation
      const createResult = await safeDbOperation(async () =>
        await supabaseAdmin
          .from('license_activations')
          .insert({
            license_id: license.id,
            device_id: data.deviceId,
            device_name: data.deviceInfo.hostname,
            device_info: data.deviceInfo,
            active: true,
            activated_at: new Date().toISOString(),
            last_seen: new Date().toISOString()
          })
          .select()
          .single()
      );
      
      activation = createResult.data as any;
    }
    
    if (!activation) {
      throw new Error('Failed to activate license');
    }
    
    // Get hotkeys for this license
    const hotkeysResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('hotkey_packs')
        .select('hotkeys')
        .in('id', license.pack_ids || [])
    );
    
    const hotkeys = hotkeysResult.success && hotkeysResult.data
      ? hotkeysResult.data.flatMap(pack => pack.hotkeys || [])
      : [];
    
    logger.info({
      type: 'license_activated',
      licenseId: license.id,
      deviceId: data.deviceId,
      hotkeyCount: hotkeys.length
    });
    
    // Return activation response
    return NextResponse.json({
      success: true,
      license: {
        key: license.key,
        userId: license.user_id,
        deviceId: data.deviceId,
        hotkeys,
        maxDevices: license.max_devices || 1,
        expiresAt: license.expires_at
      },
      activation: {
        id: activation.id,
        activatedAt: activation.activated_at,
        deviceName: activation.device_name
      }
    });
    
  } catch (error) {
    return handleApiError(error, { endpoint: '/api/license/activate' });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Deactivate license on device
    await rateLimiters.api(request);
    
    const { licenseKey, deviceId } = await request.json();
    
    if (!licenseKey || !deviceId) {
      throw new ValidationError('License key and device ID required');
    }
    
    // Find license
    const licenseResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('licenses')
        .select('id')
        .eq('key', licenseKey)
        .single()
    );
    
    if (!licenseResult.success || !licenseResult.data) {
      throw new ValidationError('Invalid license key');
    }
    
    // Deactivate
    const deactivateResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('license_activations')
        .update({
          active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('license_id', (licenseResult.data as any).id)
        .eq('device_id', deviceId)
    );
    
    if (!deactivateResult.success) {
      throw new Error('Failed to deactivate license');
    }
    
    logger.info({
      type: 'license_deactivated',
      licenseId: (licenseResult.data as any).id,
      deviceId
    });
    
    return NextResponse.json({
      success: true,
      message: 'License deactivated successfully'
    });
    
  } catch (error) {
    return handleApiError(error, { endpoint: '/api/license/deactivate' });
  }
}
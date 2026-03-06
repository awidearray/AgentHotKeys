import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import { validateRequest } from '@/lib/validation';
import { AuthenticationError, ValidationError, handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';
import { z } from 'zod';

const bulkLicenseSchema = z.object({
  licenses: z.array(z.object({
    hotkey_pack_ids: z.array(z.string().uuid()),
    buyer_user_id: z.string().uuid(),
    tier: z.enum(['basic', 'pro', 'team', 'enterprise']).default('basic'),
    max_devices: z.number().int().min(1).max(10).default(1),
    expires_at: z.string().datetime().optional(),
    purchase_amount: z.number().min(0),
    payment_method: z.string(),
    external_transaction_id: z.string().optional(),
    buyer_email: z.string().email().optional()
  })).min(1).max(50),
  discount_percentage: z.number().min(0).max(50).default(0),
  batch_id: z.string().optional()
});

/**
 * AI Agent Bulk License Generation API
 */
export async function POST(request: NextRequest) {
  try {
    await rateLimiters.api(request);
    
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      throw new AuthenticationError('API key required');
    }
    
    const agentResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('users')
        .select(`
          id, 
          name, 
          role,
          ai_agents!inner(id, agent_name, is_active, rate_limit)
        `)
        .eq('api_key', apiKey)
        .eq('role', 'ai_agent')
        .single()
    );
    
    if (!agentResult.success || !agentResult.data) {
      throw new AuthenticationError('Invalid API key');
    }
    
    const agent = agentResult.data as any;
    const aiAgent = agent.ai_agents;
    
    if (!aiAgent.is_active) {
      throw new AuthenticationError('AI agent account is disabled');
    }
    
    const body = await request.json();
    const data = await validateRequest(bulkLicenseSchema, body);
    
    logger.info({
      type: 'ai_agent_bulk_license_generation',
      agentId: agent.id,
      agentName: aiAgent.agent_name,
      licenseCount: data.licenses.length,
      batchId: data.batch_id
    });
    
    // Validate pack ownership
    const allPackIds = [...new Set(data.licenses.flatMap(l => l.hotkey_pack_ids))];
    
    const packOwnershipResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('hotkey_packs')
        .select('id, name, price, creator_id')
        .in('id', allPackIds)
    );
    
    if (!packOwnershipResult.success || !packOwnershipResult.data) {
      throw new ValidationError('Invalid hotkey pack IDs');
    }
    
    const packs = packOwnershipResult.data;
    const unauthorizedPacks = packs.filter((pack: any) => pack.creator_id !== agent.id);
    
    if (unauthorizedPacks.length > 0) {
      throw new ValidationError('AI agent does not own all specified hotkey packs');
    }
    
    // Create pack lookup for pricing
    const packLookup = packs.reduce((acc: any, pack: any) => {
      acc[pack.id] = pack;
      return acc;
    }, {});
    
    // Process licenses in batch
    const results = [];
    const errors = [];
    
    for (let i = 0; i < data.licenses.length; i++) {
      const licenseData = data.licenses[i];
      
      try {
        // Calculate price with discount
        const basePrice = licenseData.hotkey_pack_ids
          .reduce((sum, packId) => sum + packLookup[packId].price, 0);
        const discountedPrice = basePrice * (1 - data.discount_percentage / 100);
        
        // Generate unique license key
        const licenseKey = await generateUniqueLicenseKey(`BULK${i}`);
        
        // Create license
        const licenseResult = await safeDbOperation(async () =>
          await supabaseAdmin
            .from('licenses')
            .insert({
              key: licenseKey,
              user_id: licenseData.buyer_user_id,
              tier: licenseData.tier,
              pack_ids: licenseData.hotkey_pack_ids,
              max_devices: licenseData.max_devices,
              expires_at: licenseData.expires_at,
              creator_id: agent.id,
              creator_type: 'ai_agent',
              creator_name: aiAgent.agent_name,
              creator_avatar_url: (agent as any).avatar_url,
              purchase_price: discountedPrice,
              attribution_required: true,
              stripe_payment_id: licenseData.external_transaction_id
            })
            .select()
            .single()
        );
        
        if (!licenseResult.success || !licenseResult.data) {
          throw new Error('Failed to create license');
        }
        
        const license = licenseResult.data as any;
        
        // Create revenue share
        await safeDbOperation(async () =>
          await supabaseAdmin
            .from('revenue_shares')
            .insert({
              license_id: license.id,
              creator_share: 0.7000,
              platform_share: 0.2000, 
              infrastructure_share: 0.1000,
              creator_amount: discountedPrice * 0.70,
              platform_amount: discountedPrice * 0.20,
              infrastructure_amount: discountedPrice * 0.10
            })
        );
        
        results.push({
          success: true,
          license_key: licenseKey,
          license_id: license.id,
          buyer_user_id: licenseData.buyer_user_id,
          original_price: basePrice,
          discounted_price: discountedPrice,
          discount_amount: basePrice - discountedPrice
        });
        
      } catch (error) {
        errors.push({
          index: i,
          buyer_user_id: licenseData.buyer_user_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Track bulk operation analytics
    const totalRevenue = results.reduce((sum, r) => sum + r.discounted_price, 0);
    await trackBulkOperation(agent.id, data.batch_id, results.length, errors.length, totalRevenue);
    
    logger.info({
      type: 'ai_agent_bulk_licenses_created',
      agentId: agent.id,
      successful: results.length,
      failed: errors.length,
      totalRevenue,
      batchId: data.batch_id
    });
    
    return NextResponse.json({
      success: true,
      batch_id: data.batch_id,
      summary: {
        total_requested: data.licenses.length,
        successful: results.length,
        failed: errors.length,
        total_revenue: totalRevenue,
        average_discount: data.discount_percentage
      },
      licenses: results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    return handleApiError(error, { 
      endpoint: '/api/ai-agent/bulk-licenses',
      agent_api_key: request.headers.get('x-api-key')?.substring(0, 8) + '...'
    });
  }
}

/**
 * Generate unique license key with prefix
 */
async function generateUniqueLicenseKey(prefix = ''): Promise<string> {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    const key = generateLicenseKey(prefix);
    
    const existingResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('licenses')
        .select('id')
        .eq('key', key)
        .single()
    );
    
    if (!existingResult.success) {
      return key;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique license key');
}

/**
 * Generate license key for bulk operations
 */
function generateLicenseKey(prefix = ''): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'AIAG-';
  
  if (prefix) {
    result += prefix.substring(0, 4).toUpperCase() + '-';
  }
  
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i < 7) {
      result += '-';
    }
  }
  
  return result;
}

/**
 * Track bulk operation analytics
 */
async function trackBulkOperation(
  agentId: string,
  batchId: string | undefined,
  successful: number,
  failed: number,
  totalRevenue: number
): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/analytics/bulk-operation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        batchId,
        successful,
        failed,
        totalRevenue,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    logger.warn({ type: 'bulk_operation_analytics_failed', error });
  }
}
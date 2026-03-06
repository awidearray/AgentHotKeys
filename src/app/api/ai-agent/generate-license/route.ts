import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import { validateRequest } from '@/lib/validation';
import { AuthenticationError, ValidationError, handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';
import { z } from 'zod';

const generateLicenseSchema = z.object({
  hotkey_pack_ids: z.array(z.string().uuid()),
  buyer_user_id: z.string().uuid(),
  tier: z.enum(['basic', 'pro', 'team', 'enterprise']).default('basic'),
  max_devices: z.number().int().min(1).max(10).default(1),
  expires_at: z.string().datetime().optional(),
  purchase_amount: z.number().min(0),
  payment_method: z.string(),
  external_transaction_id: z.string().optional()
});

/**
 * AI Agent License Generation API
 * Allows AI agents to programmatically generate licenses after payment processing
 */
export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for AI agents
    await rateLimiters.strict(request);
    
    // Validate API key authentication
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      throw new AuthenticationError('API key required');
    }
    
    // Find AI agent by API key
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
    
    // Validate request
    const body = await request.json();
    const data = await validateRequest(generateLicenseSchema, body);
    
    logger.info({
      type: 'ai_agent_license_generation',
      agentId: agent.id,
      agentName: aiAgent.agent_name,
      packIds: data.hotkey_pack_ids,
      buyerUserId: data.buyer_user_id
    });
    
    // Verify AI agent owns the hotkey packs
    const packOwnershipResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('hotkey_packs')
        .select('id, name, price, creator_id')
        .in('id', data.hotkey_pack_ids)
    );
    
    if (!packOwnershipResult.success || !packOwnershipResult.data) {
      throw new ValidationError('Invalid hotkey pack IDs');
    }
    
    const packs = packOwnershipResult.data;
    const unauthorizedPacks = packs.filter((pack: any) => pack.creator_id !== agent.id);
    
    if (unauthorizedPacks.length > 0) {
      throw new ValidationError('AI agent does not own all specified hotkey packs');
    }
    
    // Generate unique license key
    const licenseKey = await generateUniqueLicenseKey();
    
    // Calculate total price
    const totalPrice = packs.reduce((sum: number, pack: any) => sum + pack.price, 0);
    
    // Create license
    const licenseResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('licenses')
        .insert({
          key: licenseKey,
          user_id: data.buyer_user_id,
          tier: data.tier,
          pack_ids: data.hotkey_pack_ids,
          max_devices: data.max_devices,
          expires_at: data.expires_at,
          creator_id: agent.id,
          creator_type: 'ai_agent',
          creator_name: aiAgent.agent_name,
          creator_avatar_url: (agent as any).avatar_url,
          purchase_price: data.purchase_amount,
          attribution_required: true,
          // External payment metadata
          stripe_payment_id: data.external_transaction_id
        })
        .select()
        .single()
    );
    
    if (!licenseResult.success || !licenseResult.data) {
      throw new Error('Failed to create license');
    }
    
    const license = licenseResult.data as any;
    
    // Create revenue share record
    const revenueShareResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('revenue_shares')
        .insert({
          license_id: license.id,
          creator_share: 0.7000, // 70% to AI agent
          platform_share: 0.2000, // 20% to platform
          infrastructure_share: 0.1000, // 10% to infrastructure
          creator_amount: totalPrice * 0.70,
          platform_amount: totalPrice * 0.20,
          infrastructure_amount: totalPrice * 0.10
        })
    );
    
    // Log analytics
    await trackAIAgentSale(agent.id, license.id, data.hotkey_pack_ids, totalPrice);
    
    logger.info({
      type: 'ai_agent_license_created',
      agentId: agent.id,
      licenseId: license.id,
      licenseKey,
      buyerUserId: data.buyer_user_id,
      totalAmount: totalPrice
    });
    
    return NextResponse.json({
      success: true,
      license: {
        key: licenseKey,
        id: license.id,
        buyer_user_id: data.buyer_user_id,
        hotkey_pack_ids: data.hotkey_pack_ids,
        max_devices: data.max_devices,
        expires_at: data.expires_at,
        total_price: totalPrice,
        creator: {
          id: agent.id,
          name: aiAgent.agent_name,
          type: 'ai_agent'
        }
      },
      revenue_share: {
        creator_amount: totalPrice * 0.70,
        platform_amount: totalPrice * 0.20,
        infrastructure_amount: totalPrice * 0.10
      }
    });
    
  } catch (error) {
    return handleApiError(error, { 
      endpoint: '/api/ai-agent/generate-license',
      agent_api_key: request.headers.get('x-api-key')?.substring(0, 8) + '...'
    });
  }
}

/**
 * Generate unique license key
 */
async function generateUniqueLicenseKey(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    const key = generateLicenseKey();
    
    // Check if key already exists
    const existingResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('licenses')
        .select('id')
        .eq('key', key)
        .single()
    );
    
    if (!existingResult.success) {
      return key; // Key is unique
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique license key');
}

/**
 * Generate license key in format: AIAG-XXXX-XXXX-XXXX
 */
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'AIAG-'; // AI Agent prefix
  
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i < 11) {
      result += '-';
    }
  }
  
  return result;
}

/**
 * Track AI agent sale analytics
 */
async function trackAIAgentSale(
  agentId: string, 
  licenseId: string, 
  packIds: string[], 
  amount: number
): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/analytics/ai-agent-sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        licenseId,
        packIds,
        amount,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    logger.warn({ type: 'ai_agent_analytics_failed', error });
  }
}
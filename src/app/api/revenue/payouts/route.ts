import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors';
import { rateLimiters } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Revenue Payouts API
 * Handles revenue sharing payouts to creators (both AI agents and humans)
 */
export async function GET(request: NextRequest) {
  try {
    await rateLimiters.api(request);
    
    // Check admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Admin token required');
    }
    
    const token = authHeader.substring(7);
    // Verify admin token (implement your admin auth logic)
    if (token !== process.env.ADMIN_SECRET_TOKEN) {
      throw new AuthenticationError('Invalid admin token');
    }
    
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creator_id');
    const status = searchParams.get('status') || 'pending'; // pending, paid, failed
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    
    // Get pending payouts
    let query = supabaseAdmin
      .from('revenue_shares')
      .select(`
        *,
        licenses!inner(
          id,
          key,
          creator_id,
          creator_name,
          creator_type,
          purchase_price,
          created_at
        )
      `)
      .limit(limit);
    
    if (creatorId) {
      query = query.eq('licenses.creator_id', creatorId);
    }
    
    if (status === 'pending') {
      query = query.eq('creator_paid', false);
    } else if (status === 'paid') {
      query = query.eq('creator_paid', true);
    }
    
    const payoutsResult = await safeDbOperation(async () => await query);
    
    if (!payoutsResult.success) {
      throw new Error('Failed to fetch payouts');
    }
    
    const payouts = (payoutsResult.data as any[]) || [];
    
    // Aggregate by creator
    const creatorPayouts = payouts.reduce((acc: any, payout: any) => {
      const creatorId = payout.licenses.creator_id;
      const creatorName = payout.licenses.creator_name;
      const creatorType = payout.licenses.creator_type;
      
      if (!acc[creatorId]) {
        acc[creatorId] = {
          creator_id: creatorId,
          creator_name: creatorName,
          creator_type: creatorType,
          total_amount: 0,
          transaction_count: 0,
          oldest_transaction: null,
          newest_transaction: null,
          transactions: []
        };
      }
      
      acc[creatorId].total_amount += payout.creator_amount || 0;
      acc[creatorId].transaction_count += 1;
      acc[creatorId].transactions.push({
        license_id: payout.license_id,
        license_key: payout.licenses.key,
        amount: payout.creator_amount,
        purchase_date: payout.licenses.created_at,
        paid: payout.creator_paid,
        paid_at: payout.paid_at
      });
      
      // Track date ranges
      const transactionDate = new Date(payout.licenses.created_at);
      if (!acc[creatorId].oldest_transaction || transactionDate < new Date(acc[creatorId].oldest_transaction)) {
        acc[creatorId].oldest_transaction = payout.licenses.created_at;
      }
      if (!acc[creatorId].newest_transaction || transactionDate > new Date(acc[creatorId].newest_transaction)) {
        acc[creatorId].newest_transaction = payout.licenses.created_at;
      }
      
      return acc;
    }, {});
    
    return NextResponse.json({
      success: true,
      summary: {
        total_creators: Object.keys(creatorPayouts).length,
        total_amount: payouts.reduce((sum: number, p: any) => sum + (p.creator_amount || 0), 0),
        total_transactions: payouts.length
      },
      payouts: Object.values(creatorPayouts)
    });
    
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/revenue/payouts'
    });
  }
}

/**
 * Process payout for a creator
 */
export async function POST(request: NextRequest) {
  try {
    await rateLimiters.strict(request);
    
    // Check admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Admin token required');
    }
    
    const token = authHeader.substring(7);
    if (token !== process.env.ADMIN_SECRET_TOKEN) {
      throw new AuthenticationError('Invalid admin token');
    }
    
    const body = await request.json();
    const { creator_id, payout_method, transaction_ids } = body;
    
    if (!creator_id || !payout_method) {
      throw new ValidationError('Creator ID and payout method required');
    }
    
    // Get pending revenue shares for creator
    let query = supabaseAdmin
      .from('revenue_shares')
      .select(`
        *,
        licenses!inner(creator_id, creator_name, creator_type)
      `)
      .eq('licenses.creator_id', creator_id)
      .eq('creator_paid', false);
    
    if (transaction_ids && transaction_ids.length > 0) {
      query = query.in('id', transaction_ids);
    }
    
    const pendingResult = await safeDbOperation(async () => await query);
    
    if (!pendingResult.success || !pendingResult.data || !Array.isArray(pendingResult.data) || pendingResult.data.length === 0) {
      throw new ValidationError('No pending payouts found for creator');
    }
    
    const pendingPayouts = pendingResult.data as any[];
    const totalAmount = pendingPayouts.reduce((sum: number, p: any) => sum + (p.creator_amount || 0), 0);
    const creator = pendingPayouts[0].licenses;
    
    logger.info({
      type: 'payout_processing_started',
      creatorId: creator_id,
      creatorName: creator.creator_name,
      creatorType: creator.creator_type,
      totalAmount,
      transactionCount: pendingPayouts.length,
      payoutMethod: payout_method
    });
    
    // Process payout based on method
    let payoutResult;
    
    switch (payout_method) {
      case 'stripe_transfer':
        payoutResult = await processStripeTransfer(creator, totalAmount, pendingPayouts);
        break;
      case 'crypto_transfer':
        payoutResult = await processCryptoTransfer(creator, totalAmount, pendingPayouts);
        break;
      case 'manual':
        payoutResult = await processManualPayout(creator, totalAmount, pendingPayouts);
        break;
      default:
        throw new ValidationError('Invalid payout method');
    }
    
    if (payoutResult.success) {
      // Mark payouts as paid
      const updateResult = await safeDbOperation(async () =>
        await supabaseAdmin
          .from('revenue_shares')
          .update({
            creator_paid: true,
            paid_at: new Date().toISOString()
          })
          .in('id', pendingPayouts.map((p: any) => p.id))
      );
      
      if (updateResult.success) {
        logger.info({
          type: 'payout_completed',
          creatorId: creator_id,
          totalAmount,
          payoutId: payoutResult.payout_id,
          method: payout_method
        });
      }
    }
    
    return NextResponse.json({
      success: payoutResult.success,
      payout_id: payoutResult.payout_id,
      total_amount: totalAmount,
      transaction_count: pendingPayouts.length,
      method: payout_method,
      error: 'error' in payoutResult ? payoutResult.error : undefined
    });
    
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/revenue/payouts'
    });
  }
}

/**
 * Process Stripe transfer payout
 */
async function processStripeTransfer(creator: any, amount: number, _payouts: any[]) {
  try {
    // This would integrate with Stripe Connect for payouts
    // For now, return mock success
    logger.info({
      type: 'stripe_transfer_processed',
      creatorId: creator.creator_id,
      amount
    });
    
    return {
      success: true,
      payout_id: `stripe_${Date.now()}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Stripe transfer failed'
    };
  }
}

/**
 * Process crypto transfer payout
 */
async function processCryptoTransfer(creator: any, amount: number, _payouts: any[]) {
  try {
    // This would integrate with crypto wallet transfers
    // For now, return mock success
    logger.info({
      type: 'crypto_transfer_processed',
      creatorId: creator.creator_id,
      amount
    });
    
    return {
      success: true,
      payout_id: `crypto_${Date.now()}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Crypto transfer failed'
    };
  }
}

/**
 * Process manual payout (admin confirms external payment)
 */
async function processManualPayout(creator: any, amount: number, _payouts: any[]) {
  // Manual payouts are immediately marked as successful
  // Admin confirms they've handled payment externally
  logger.info({
    type: 'manual_payout_processed',
    creatorId: creator.creator_id,
    amount
  });
  
  return {
    success: true,
    payout_id: `manual_${Date.now()}`
  };
}
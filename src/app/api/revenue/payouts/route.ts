import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors';
import { rateLimiters } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const PayoutRequestSchema = z.object({
  creator_id: z.string().uuid(),
  payout_method: z.enum(['manual']),
  transaction_ids: z.array(z.string().uuid()).optional(),
  confirmation_reference: z.string().min(1).max(120),
  notes: z.string().max(1000).optional(),
  processed_by: z.string().uuid().optional()
});

interface RevenueShareRow {
  id: string;
  license_id: string;
  creator_amount: number | null;
  licenses: {
    creator_id: string;
    creator_name: string | null;
    creator_type: string | null;
  };
}

function requireAdminToken(request: NextRequest): void {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Admin token required');
  }

  const configuredToken = process.env.ADMIN_SECRET_TOKEN;
  if (!configuredToken) {
    throw new AuthenticationError('Admin access is not configured');
  }

  const token = authHeader.substring(7);
  if (token !== configuredToken) {
    throw new AuthenticationError('Invalid admin token');
  }
}

/**
 * Revenue Payouts API
 * Handles revenue sharing payouts to creators (both AI agents and humans)
 */
export async function GET(request: NextRequest) {
  try {
    await rateLimiters.api(request);

    requireAdminToken(request);

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creator_id');
    const status = searchParams.get('status') || 'pending';
    if (!['pending', 'paid'].includes(status)) {
      throw new ValidationError('Invalid status filter. Expected pending or paid.');
    }

    const parsedLimit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 50;

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

    requireAdminToken(request);

    const body = await request.json();
    const validated = PayoutRequestSchema.parse(body);

    let query = supabaseAdmin
      .from('revenue_shares')
      .select(`
        *,
        licenses!inner(creator_id, creator_name, creator_type)
      `)
      .eq('licenses.creator_id', validated.creator_id)
      .eq('creator_paid', false);

    if (validated.transaction_ids && validated.transaction_ids.length > 0) {
      query = query.in('id', validated.transaction_ids);
    }

    const pendingResult = await safeDbOperation(async () => await query);

    if (!pendingResult.success || !pendingResult.data || !Array.isArray(pendingResult.data) || pendingResult.data.length === 0) {
      throw new ValidationError('No pending payouts found for creator');
    }

    const pendingPayouts = pendingResult.data as RevenueShareRow[];
    const totalAmount = pendingPayouts.reduce((sum: number, p) => sum + (p.creator_amount || 0), 0);
    const creator = pendingPayouts[0].licenses;

    logger.info({
      type: 'payout_processing_started',
      creatorId: validated.creator_id,
      creatorName: creator.creator_name,
      creatorType: creator.creator_type,
      totalAmount,
      transactionCount: pendingPayouts.length,
      payoutMethod: validated.payout_method
    });

    const payoutResult = await processManualPayout({
      creatorId: validated.creator_id,
      payoutMethod: validated.payout_method,
      pendingPayouts,
      totalAmount,
      confirmationReference: validated.confirmation_reference,
      notes: validated.notes,
      processedBy: validated.processed_by
    });

    logger.info({
      type: 'payout_completed',
      creatorId: validated.creator_id,
      totalAmount,
      payoutId: payoutResult.payout_id,
      method: validated.payout_method
    });

    return NextResponse.json({
      success: true,
      payout_id: payoutResult.payout_id,
      total_amount: totalAmount,
      transaction_count: pendingPayouts.length,
      method: validated.payout_method
    });

  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/revenue/payouts'
    });
  }
}

async function processManualPayout(params: {
  creatorId: string;
  payoutMethod: 'manual';
  pendingPayouts: RevenueShareRow[];
  totalAmount: number;
  confirmationReference: string;
  notes?: string;
  processedBy?: string;
}): Promise<{ payout_id: string }> {
  let payoutBatchId: string | null = null;
  let updatedShareIds: string[] = [];

  try {
    const nowIso = new Date().toISOString();
    const transactionCount = params.pendingPayouts.length;

    const batchInsert = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('payout_batches')
        .insert({
          creator_id: params.creatorId,
          payout_method: params.payoutMethod,
          total_amount: params.totalAmount,
          currency: 'USD',
          transaction_count: transactionCount,
          status: 'completed',
          processed_by: params.processedBy ?? null,
          confirmation_reference: params.confirmationReference,
          notes: params.notes ?? null,
          created_at: nowIso
        })
        .select('id')
        .single()
    );

    if (!batchInsert.success || !batchInsert.data) {
      throw new Error(batchInsert.error || 'Failed to create payout batch');
    }

    payoutBatchId = (batchInsert.data as { id: string }).id;

    const batchItemsInsert = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('payout_batch_items')
        .insert(
          params.pendingPayouts.map((payout) => ({
            payout_batch_id: payoutBatchId,
            revenue_share_id: payout.id
          }))
        )
    );

    if (!batchItemsInsert.success) {
      throw new Error(batchItemsInsert.error || 'Failed to create payout batch items');
    }

    const targetRevenueShareIds = params.pendingPayouts.map((payout) => payout.id);
    const updateResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('revenue_shares')
        .update({
          creator_paid: true,
          paid_at: nowIso
        })
        .in('id', targetRevenueShareIds)
        .eq('creator_paid', false)
        .select('id')
    );

    if (!updateResult.success) {
      throw new Error(updateResult.error || 'Failed to update revenue shares');
    }

    updatedShareIds = ((updateResult.data as { id: string }[] | null) || []).map((row) => row.id);
    if (updatedShareIds.length !== targetRevenueShareIds.length) {
      throw new Error('Payout update mismatch: one or more transactions were already paid');
    }

    return { payout_id: payoutBatchId };
  } catch (error) {
    if (updatedShareIds.length > 0) {
      await safeDbOperation(async () =>
        await supabaseAdmin
          .from('revenue_shares')
          .update({
            creator_paid: false,
            paid_at: null
          })
          .in('id', updatedShareIds)
      );
    }

    if (payoutBatchId) {
      await safeDbOperation(async () =>
        await supabaseAdmin
          .from('payout_batches')
          .delete()
          .eq('id', payoutBatchId)
      );
    }

    throw error;
  }
}
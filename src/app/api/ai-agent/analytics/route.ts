import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import { AuthenticationError, handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';

/**
 * AI Agent Analytics API
 * Provides sales and performance analytics for AI agents
 */
export async function GET(request: NextRequest) {
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
          created_at,
          ai_agents!inner(id, agent_name, is_active)
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
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const includeDetails = searchParams.get('details') === 'true';
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    // Get sales analytics
    const salesResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('licenses')
        .select('id, purchase_price, created_at, pack_ids, user_id')
        .eq('creator_id', agent.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    );
    
    const sales = (salesResult.success ? salesResult.data : []) as any[];
    
    // Get installation analytics
    const installationResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('installation_attributions')
        .select('*')
        .eq('creator_id', agent.id)
        .gte('installed_at', startDate.toISOString())
        .lte('installed_at', endDate.toISOString())
    );
    
    const installations = (installationResult.success ? installationResult.data : []) as any[];
    
    // Get hotkey pack performance
    const packsResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .from('hotkey_packs')
        .select('id, name, price, downloads, rating_average, rating_count')
        .eq('creator_id', agent.id)
    );
    
    const packs = (packsResult.success ? packsResult.data : []) as any[];
    
    // Get revenue shares
    const revenueResult = await safeDbOperation(async () =>
      await supabaseAdmin
        .rpc('get_ai_agent_revenue', {
          agent_id: agent.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        })
    );
    
    const revenue = (revenueResult.success ? revenueResult.data : []) as any[];
    
    // Calculate metrics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + (sale.purchase_price || 0), 0);
    const totalInstallations = installations.length;
    const uniqueUsers = new Set(sales.map((sale: any) => sale.user_id)).size;
    const conversionRate = totalInstallations > 0 ? (totalSales / totalInstallations) * 100 : 0;
    
    // Pack performance
    const packPerformance = packs.map((pack: any) => {
      const packSales = sales.filter((sale: any) => sale.pack_ids?.includes(pack.id));
      const packInstallations = installations.filter((inst: any) => inst.hotkey_pack_id === pack.id);
      
      return {
        ...pack,
        sales_count: packSales.length,
        sales_revenue: packSales.reduce((sum: number, sale: any) => sum + (sale.purchase_price || 0), 0),
        installation_count: packInstallations.length,
        conversion_rate: packInstallations.length > 0 ? (packSales.length / packInstallations.length) * 100 : 0
      };
    });
    
    // Time series data (daily)
    const dailyMetrics = generateDailyMetrics(sales, installations, startDate, endDate);
    
    const analytics = {
      agent: {
        id: agent.id,
        name: aiAgent.agent_name,
        account_created: agent.created_at,
        is_active: aiAgent.is_active
      },
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      },
      overview: {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        total_installations: totalInstallations,
        unique_users: uniqueUsers,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        average_sale_value: totalSales > 0 ? Math.round((totalRevenue / totalSales) * 100) / 100 : 0
      },
      hotkey_packs: {
        total_packs: packs.length,
        top_performer: packPerformance.sort((a, b) => b.sales_revenue - a.sales_revenue)[0] || null,
        pack_performance: includeDetails ? packPerformance : packPerformance.slice(0, 5)
      },
      revenue: {
        gross_revenue: totalRevenue,
        agent_share: totalRevenue * 0.70,
        platform_share: totalRevenue * 0.20,
        infrastructure_share: totalRevenue * 0.10,
        pending_payout: revenue.reduce((sum: number, r: any) => sum + (r.creator_paid ? 0 : r.creator_amount || 0), 0)
      },
      trends: {
        daily_metrics: dailyMetrics
      }
    };
    
    logger.info({
      type: 'ai_agent_analytics_request',
      agentId: agent.id,
      period,
      includeDetails
    });
    
    return NextResponse.json({
      success: true,
      analytics
    });
    
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai-agent/analytics',
      agent_api_key: request.headers.get('x-api-key')?.substring(0, 8) + '...'
    });
  }
}

/**
 * Generate daily metrics for time series
 */
function generateDailyMetrics(sales: any[], installations: any[], startDate: Date, endDate: Date) {
  const dailyMetrics = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const daySales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= dayStart && saleDate < dayEnd;
    });
    
    const dayInstallations = installations.filter(inst => {
      const instDate = new Date(inst.installed_at);
      return instDate >= dayStart && instDate < dayEnd;
    });
    
    dailyMetrics.push({
      date: dayStart.toISOString().split('T')[0],
      sales: daySales.length,
      revenue: daySales.reduce((sum, sale) => sum + (sale.purchase_price || 0), 0),
      installations: dayInstallations.length
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dailyMetrics;
}
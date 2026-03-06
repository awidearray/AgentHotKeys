import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  try {
    // Basic auth check - only admins can view metrics
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('metric');
    const alertSeverity = searchParams.get('severity') as any;

    const data = {
      metrics: monitoring.getMetrics(metricName || undefined),
      alerts: monitoring.getAlerts(alertSeverity),
      health: monitoring.getHealthMetrics(),
      timestamp: Date.now()
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
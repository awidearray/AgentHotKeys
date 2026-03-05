import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/supabase/client';
import { validateEnvironment } from '@/lib/env';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check all system components
    const [dbHealth, envValidation] = await Promise.all([
      checkDatabaseHealth(),
      Promise.resolve(validateEnvironment()),
    ]);
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: {
          healthy: dbHealth.healthy,
          error: dbHealth.error,
        },
        environment: {
          healthy: envValidation.isValid,
          errors: envValidation.errors,
        },
      },
      overall: {
        healthy: dbHealth.healthy && envValidation.isValid,
      },
    };
    
    const statusCode = healthStatus.overall.healthy ? 200 : 503;
    
    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}
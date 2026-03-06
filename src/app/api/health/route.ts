import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/supabase/client';
import { validateEnvironment } from '@/lib/env';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import * as os from 'os';
import * as process from 'process';

export async function GET() {
  const startTime = Date.now();
  const relaxedHealthcheck =
    process.env.RAILWAY_ENVIRONMENT === 'production' ||
    process.env.HEALTHCHECK_RELAXED === 'true';
  
  try {
    // Check components without failing the endpoint on individual probe errors.
    const [dbResult, envResult] = await Promise.allSettled([
      checkDatabaseHealth(),
      Promise.resolve(validateEnvironment()),
    ]);

    const dbHealth =
      dbResult.status === 'fulfilled'
        ? dbResult.value
        : {
            healthy: false,
            error:
              dbResult.reason instanceof Error
                ? dbResult.reason.message
                : 'Database health check failed',
            latency: null,
          };

    const envValidation =
      envResult.status === 'fulfilled'
        ? envResult.value
        : {
            isValid: false,
            errors: [
              envResult.reason instanceof Error
                ? envResult.reason.message
                : 'Environment validation failed',
            ],
          };
    
    const responseTime = Date.now() - startTime;
    
    // Record health metrics
    monitoring.checkDatabaseHealth(dbHealth.healthy, dbHealth.latency);
    monitoring.recordMetric({
      name: 'health_check_duration',
      value: responseTime
    });
    
    // System metrics
    const memoryUsage = process.memoryUsage();
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      cpu: {
        usage: process.cpuUsage(),
        cores: os.cpus().length,
      },
    };
    
    const overallHealthy = dbHealth.healthy && envValidation.isValid;
    const healthStatus = {
      status: overallHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: {
          healthy: dbHealth.healthy,
          error: dbHealth.error,
          latency: dbHealth.latency,
        },
        environment: {
          healthy: envValidation.isValid,
          errors: envValidation.errors,
        },
        cache: {
          healthy: true,
          type: 'memory',
        },
      },
      system: systemInfo,
      overall: {
        healthy: overallHealthy,
        score: calculateHealthScore(dbHealth.healthy, envValidation.isValid, responseTime),
      },
    };
    
    const statusCode = relaxedHealthcheck
      ? 200
      : healthStatus.overall.healthy
      ? 200
      : 503;
    
    // Log health check
    if (!healthStatus.overall.healthy) {
      logger.warn({
        type: 'health_check',
        status: 'unhealthy',
        services: healthStatus.services,
      });
    }
    
    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    logger.error({
      type: 'health_check',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
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

function calculateHealthScore(
  dbHealthy: boolean,
  envValid: boolean,
  responseTime: number
): number {
  let score = 100;
  
  if (!dbHealthy) score -= 40;
  if (!envValid) score -= 30;
  if (responseTime > 1000) score -= 10;
  if (responseTime > 2000) score -= 10;
  if (responseTime > 3000) score -= 10;
  
  return Math.max(0, score);
}
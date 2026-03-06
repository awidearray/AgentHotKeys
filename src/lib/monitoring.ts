import { logger } from './logger';

export interface Metric {
  name: string;
  value: number;
  timestamp?: number;
  tags?: Record<string, string | number>;
}

export interface Alert {
  name: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: number;
  metadata?: Record<string, any>;
}

class Monitoring {
  private metrics: Map<string, Metric[]> = new Map();
  private alerts: Alert[] = [];
  private readonly maxMetricsPerName = 1000;
  private readonly maxAlerts = 500;

  recordMetric(metric: Metric) {
    const { name } = metric;
    const metricWithTimestamp = {
      ...metric,
      timestamp: metric.timestamp || Date.now()
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metricWithTimestamp);

    // Keep only the most recent metrics
    if (metrics.length > this.maxMetricsPerName) {
      metrics.shift();
    }

    logger.info({
      type: 'metric',
      metric: metricWithTimestamp
    });
  }

  recordAlert(alert: Alert) {
    const alertWithTimestamp = {
      ...alert,
      timestamp: alert.timestamp || Date.now()
    };

    this.alerts.push(alertWithTimestamp);

    // Keep only the most recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.shift();
    }

    logger.warn({
      type: 'alert',
      alert: alertWithTimestamp
    });

    // In production, you would send this to an alerting service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAlertingService(alertWithTimestamp);
    }
  }

  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    // Return all metrics
    const allMetrics: Metric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    return allMetrics.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  getAlerts(severity?: Alert['severity']): Alert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return [...this.alerts];
  }

  getHealthMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      timestamp: Date.now()
    };
  }

  private async sendToAlertingService(alert: Alert) {
    // Placeholder for actual alerting service integration
    // You would implement this with services like:
    // - PagerDuty
    // - Slack webhooks
    // - Discord webhooks
    // - Email notifications
    // - SMS alerts
    
    try {
      // Example: Send to webhook
      if (process.env.ALERT_WEBHOOK_URL) {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 ${alert.severity.toUpperCase()}: ${alert.name}`,
            description: alert.message,
            timestamp: alert.timestamp,
            metadata: alert.metadata
          })
        });
      }
    } catch (error) {
      logger.error({
        type: 'alert_delivery_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        alert: alert.name
      });
    }
  }

  // Helper methods for common metrics
  recordResponseTime(endpoint: string, duration: number, statusCode: number) {
    this.recordMetric({
      name: 'http_request_duration',
      value: duration,
      tags: { endpoint, status_code: statusCode }
    });
  }

  recordDatabaseQuery(operation: string, duration: number, success: boolean) {
    this.recordMetric({
      name: 'database_query_duration',
      value: duration,
      tags: { operation, success: success ? 1 : 0 }
    });
  }

  recordUserAction(action: string, userId?: string) {
    this.recordMetric({
      name: 'user_action',
      value: 1,
      tags: { action, user_id: userId || 'anonymous' }
    });
  }

  // Health check alerts
  checkDatabaseHealth(isHealthy: boolean, latency: number) {
    if (!isHealthy) {
      this.recordAlert({
        name: 'database_unhealthy',
        message: 'Database health check failed',
        severity: 'critical',
        metadata: { latency }
      });
    }

    if (latency > 5000) { // 5 seconds
      this.recordAlert({
        name: 'database_slow',
        message: `Database response time is ${latency}ms`,
        severity: 'medium',
        metadata: { latency }
      });
    }
  }

  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usage = (heapUsedMB / heapTotalMB) * 100;

    if (usage > 90) {
      this.recordAlert({
        name: 'high_memory_usage',
        message: `Memory usage is ${usage.toFixed(1)}%`,
        severity: 'high',
        metadata: { usage, heapUsedMB, heapTotalMB }
      });
    }
  }
}

export const monitoring = new Monitoring();

// Automatically record system metrics every minute
if (typeof process !== 'undefined') {
  setInterval(() => {
    const healthMetrics = monitoring.getHealthMetrics();
    
    monitoring.recordMetric({
      name: 'memory_usage',
      value: healthMetrics.memory.heapUsed,
      tags: { type: 'heap_used' }
    });
    
    monitoring.recordMetric({
      name: 'memory_usage',
      value: healthMetrics.memory.rss,
      tags: { type: 'rss' }
    });
    
    monitoring.checkMemoryUsage();
  }, 60000); // Every minute
}
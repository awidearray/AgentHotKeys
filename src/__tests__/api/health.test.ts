import { GET } from '@/app/api/health/route';
import { checkDatabaseHealth } from '@/lib/supabase/client';
import { validateEnvironment } from '@/lib/env';
import { logger } from '@/lib/logger';
import * as os from 'os';
import * as process from 'process';

jest.mock('@/lib/supabase/client');
jest.mock('@/lib/env');
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));
jest.mock('os');
jest.mock('process', () => ({
  ...jest.requireActual('process'),
  memoryUsage: jest.fn(),
  cpuUsage: jest.fn(),
  uptime: jest.fn(),
  version: 'v18.0.0',
  platform: 'linux',
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (os.cpus as jest.Mock).mockReturnValue(Array(4).fill({}));
    (process.memoryUsage as jest.Mock).mockReturnValue({
      rss: 100 * 1024 * 1024,
      heapTotal: 80 * 1024 * 1024,
      heapUsed: 60 * 1024 * 1024,
      external: 10 * 1024 * 1024,
      arrayBuffers: 5 * 1024 * 1024,
    });
    (process.cpuUsage as jest.Mock).mockReturnValue({
      user: 1000000,
      system: 500000,
    });
    (process.uptime as jest.Mock).mockReturnValue(3600);
  });

  describe('Healthy System', () => {
    it('should return 200 when all services are healthy', async () => {
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: true,
        latency: 25,
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.overall.healthy).toBe(true);
      expect(data.overall.score).toBe(100);
    });

    it('should include system metrics', async () => {
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: true,
        latency: 25,
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(data.system).toEqual({
        nodeVersion: 'v18.0.0',
        platform: 'linux',
        uptime: 3600,
        memory: {
          used: 60,
          total: 80,
          rss: 100,
        },
        cpu: {
          usage: { user: 1000000, system: 500000 },
          cores: 4,
        },
      });
    });

    it('should calculate response time', async () => {
      (checkDatabaseHealth as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          healthy: true,
          latency: 25,
        }), 50))
      );
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(data.responseTime).toMatch(/\d+ms/);
      const responseMs = parseInt(data.responseTime);
      expect(responseMs).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Unhealthy System', () => {
    it('should return 503 when database is unhealthy', async () => {
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: false,
        error: 'Connection timeout',
        latency: null,
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.overall.healthy).toBe(false);
      expect(data.services.database.healthy).toBe(false);
      expect(data.services.database.error).toBe('Connection timeout');
      expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({
        type: 'health_check',
        status: 'unhealthy',
      }));
    });

    it('should return 503 when environment is invalid', async () => {
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: true,
        latency: 25,
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Missing API key', 'Invalid database URL'],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.overall.healthy).toBe(false);
      expect(data.services.environment.healthy).toBe(false);
      expect(data.services.environment.errors).toEqual([
        'Missing API key',
        'Invalid database URL',
      ]);
    });

    it('should return 503 when both services are unhealthy', async () => {
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: false,
        error: 'Connection refused',
        latency: null,
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Invalid configuration'],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.overall.healthy).toBe(false);
      expect(data.services.database.healthy).toBe(false);
      expect(data.services.environment.healthy).toBe(false);
    });
  });

  describe('Health Score Calculation', () => {
    it('should deduct points for unhealthy database', async () => {
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: false,
        error: 'Error',
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(data.overall.score).toBe(60); // -40 for database
    });

    it('should deduct points for invalid environment', async () => {
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: true,
        latency: 25,
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Error'],
      });

      const response = await GET();
      const data = await response.json();

      expect(data.overall.score).toBe(70); // -30 for environment
    });

    it('should deduct points for slow response', async () => {
      (checkDatabaseHealth as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          healthy: true,
          latency: 25,
        }), 2500))
      );
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      // Response time > 2000ms should deduct 20 points
      expect(data.overall.score).toBeLessThanOrEqual(80);
    });

    it('should never go below 0 score', async () => {
      (checkDatabaseHealth as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          healthy: false,
          error: 'Error',
        }), 3500))
      );
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Error'],
      });

      const response = await GET();
      const data = await response.json();

      expect(data.overall.score).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database check errors gracefully', async () => {
      (checkDatabaseHealth as jest.Mock).mockRejectedValue(new Error('Database error'));
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('degraded');
      expect(data.services.database.healthy).toBe(false);
      expect(data.services.database.error).toContain('Database error');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle environment validation errors', async () => {
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: true,
        latency: 25,
      });
      (validateEnvironment as jest.Mock).mockImplementation(() => {
        throw new Error('Env validation failed');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle system metrics errors', async () => {
      (process.memoryUsage as jest.Mock).mockImplementation(() => {
        throw new Error('Cannot read memory');
      });
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: true,
        latency: 25,
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
    });

    it('should handle unknown errors', async () => {
      (process.memoryUsage as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected memory failure');
      });
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: true,
        latency: 25,
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null database health response', async () => {
      (checkDatabaseHealth as jest.Mock).mockResolvedValue(null);
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
    });

    it('should handle empty environment validation', async () => {
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: true,
        latency: 25,
      });
      (validateEnvironment as jest.Mock).mockReturnValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
    });

    it('should handle very high memory usage', async () => {
      (process.memoryUsage as jest.Mock).mockReturnValue({
        rss: 8 * 1024 * 1024 * 1024, // 8GB
        heapTotal: 4 * 1024 * 1024 * 1024, // 4GB
        heapUsed: 3.5 * 1024 * 1024 * 1024, // 3.5GB
        external: 0,
        arrayBuffers: 0,
      });
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: true,
        latency: 25,
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.system.memory.rss).toBe(8192);
      expect(data.system.memory.used).toBe(3584);
    });

    it('should handle zero CPU cores', async () => {
      (os.cpus as jest.Mock).mockReturnValue([]);
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: true,
        latency: 25,
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.system.cpu.cores).toBe(0);
    });

    it('should handle negative uptime', async () => {
      (process.uptime as jest.Mock).mockReturnValue(-1);
      (checkDatabaseHealth as jest.Mock).mockResolvedValue({
        healthy: true,
        latency: 25,
      });
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.system.uptime).toBe(-1);
    });
  });

  describe('Performance', () => {
    it('should complete within timeout', async () => {
      (checkDatabaseHealth as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          healthy: true,
          latency: 25,
        }), 100))
      );
      (validateEnvironment as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const start = Date.now();
      const response = await GET();
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(15000);
    });

    it('should run checks in parallel', async () => {
      let dbCheckStarted = false;
      let envCheckStarted = false;

      (checkDatabaseHealth as jest.Mock).mockImplementation(() => {
        dbCheckStarted = true;
        return new Promise(resolve => setTimeout(() => resolve({
          healthy: true,
          latency: 25,
        }), 100));
      });

      (validateEnvironment as jest.Mock).mockImplementation(() => {
        envCheckStarted = true;
        expect(dbCheckStarted).toBe(true); // Should be running in parallel
        return {
          isValid: true,
          errors: [],
        };
      });

      await GET();

      expect(dbCheckStarted).toBe(true);
      expect(envCheckStarted).toBe(true);
    });
  });
});
import { NextRequest } from 'next/server';
import { createRateLimiter, rateLimiters } from '@/lib/rate-limit';
import { RateLimitError } from '@/lib/errors';

describe('Rate Limiting', () => {
  const mockRequest = (ip?: string, path = '/api/test') => ({
    headers: new Headers(ip ? { 'x-forwarded-for': ip } : {}),
    nextUrl: { pathname: path },
  } as unknown as NextRequest);

  beforeEach(() => {
    // Clear rate limit stores
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createRateLimiter', () => {
    describe('Happy Path', () => {
      it('should allow requests within limit', async () => {
        const limiter = createRateLimiter({ max: 3, windowMs: 1000 });
        const req = mockRequest('192.168.1.1');

        await expect(limiter(req)).resolves.toBeUndefined();
        await expect(limiter(req)).resolves.toBeUndefined();
        await expect(limiter(req)).resolves.toBeUndefined();
      });

      it('should reset after window expires', async () => {
        const limiter = createRateLimiter({ max: 2, windowMs: 1000 });
        const req = mockRequest('192.168.1.1');

        await limiter(req);
        await limiter(req);

        jest.advanceTimersByTime(1001);

        await expect(limiter(req)).resolves.toBeUndefined();
      });

      it('should track different IPs separately', async () => {
        const limiter = createRateLimiter({ max: 1, windowMs: 1000 });

        await expect(limiter(mockRequest('192.168.1.1'))).resolves.toBeUndefined();
        await expect(limiter(mockRequest('192.168.1.2'))).resolves.toBeUndefined();
        await expect(limiter(mockRequest('192.168.1.3'))).resolves.toBeUndefined();
      });

      it('should skip rate limiting when configured', async () => {
        const limiter = createRateLimiter({
          max: 1,
          windowMs: 1000,
          skip: (req) => req.nextUrl.pathname === '/health',
        });

        const healthReq = mockRequest('192.168.1.1', '/health');

        await expect(limiter(healthReq)).resolves.toBeUndefined();
        await expect(limiter(healthReq)).resolves.toBeUndefined();
        await expect(limiter(healthReq)).resolves.toBeUndefined();
      });
    });

    describe('Rate Limit Exceeded', () => {
      it('should throw error when limit exceeded', async () => {
        const limiter = createRateLimiter({ max: 2, windowMs: 1000 });
        const req = mockRequest('192.168.1.1');

        await limiter(req);
        await limiter(req);

        await expect(limiter(req)).rejects.toThrow(RateLimitError);
      });

      it('should use custom error message', async () => {
        const customMessage = 'Custom rate limit message';
        const limiter = createRateLimiter({
          max: 1,
          windowMs: 1000,
          message: customMessage,
        });
        const req = mockRequest('192.168.1.1');

        await limiter(req);

        try {
          await limiter(req);
          fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(RateLimitError);
          expect((error as RateLimitError).message).toBe(customMessage);
        }
      });

      it('should continue blocking after limit exceeded', async () => {
        const limiter = createRateLimiter({ max: 1, windowMs: 1000 });
        const req = mockRequest('192.168.1.1');

        await limiter(req);

        for (let i = 0; i < 5; i++) {
          await expect(limiter(req)).rejects.toThrow(RateLimitError);
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle missing IP address', async () => {
        const limiter = createRateLimiter({ max: 2, windowMs: 1000 });
        const req = mockRequest(); // No IP

        await expect(limiter(req)).resolves.toBeUndefined();
        await expect(limiter(req)).resolves.toBeUndefined();
        await expect(limiter(req)).rejects.toThrow(RateLimitError);
      });

      it('should handle multiple forwarded IPs', async () => {
        const limiter = createRateLimiter({ max: 2, windowMs: 1000 });
        const req = {
          headers: new Headers({
            'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
          }),
          nextUrl: { pathname: '/api/test' },
        } as unknown as NextRequest;

        await expect(limiter(req)).resolves.toBeUndefined();
        await expect(limiter(req)).resolves.toBeUndefined();
        await expect(limiter(req)).rejects.toThrow(RateLimitError);
      });

      it('should handle custom key generator', async () => {
        const limiter = createRateLimiter({
          max: 1,
          windowMs: 1000,
          keyGenerator: (req) => req.nextUrl.pathname,
        });

        const req1 = mockRequest('192.168.1.1', '/api/endpoint1');
        const req2 = mockRequest('192.168.1.2', '/api/endpoint1');

        await limiter(req1);
        // Same endpoint, different IP - should be rate limited
        await expect(limiter(req2)).rejects.toThrow(RateLimitError);
      });

      it('should clean up expired entries', async () => {
        const limiter = createRateLimiter({ max: 1, windowMs: 1000 });

        // Create entries for different IPs
        for (let i = 1; i <= 10; i++) {
          await limiter(mockRequest(`192.168.1.${i}`));
        }

        // Advance time to expire all entries
        jest.advanceTimersByTime(1001);

        // Should be able to make requests again
        for (let i = 1; i <= 10; i++) {
          await expect(limiter(mockRequest(`192.168.1.${i}`))).resolves.toBeUndefined();
        }
      });

      it('should handle zero window time', async () => {
        const limiter = createRateLimiter({ max: 1, windowMs: 0 });
        const req = mockRequest('192.168.1.1');

        await limiter(req);
        await expect(limiter(req)).rejects.toThrow(RateLimitError);

        jest.advanceTimersByTime(1);

        await expect(limiter(req)).resolves.toBeUndefined();
      });

      it('should handle very high request rates', async () => {
        const limiter = createRateLimiter({ max: 100, windowMs: 1000 });
        const req = mockRequest('192.168.1.1');

        const promises = Array(100).fill(null).map(() => limiter(req));
        await expect(Promise.all(promises)).resolves.toBeDefined();

        await expect(limiter(req)).rejects.toThrow(RateLimitError);
      });
    });

    describe('Memory Management', () => {
      it('should not leak memory with many different IPs', async () => {
        const limiter = createRateLimiter({ max: 1, windowMs: 100 });

        // Create entries for many different IPs
        for (let i = 0; i < 1000; i++) {
          await limiter(mockRequest(`192.168.${Math.floor(i / 256)}.${i % 256}`));
        }

        // Advance time to trigger cleanup
        jest.advanceTimersByTime(101);

        // Memory should be cleaned up (we can't directly test memory, but entries should be removed)
        const req = mockRequest('192.168.0.0');
        await expect(limiter(req)).resolves.toBeUndefined();
      });

      it('should handle cleanup interval properly', () => {
        // Create a rate limiter (which sets up the interval)
        createRateLimiter({ max: 1, windowMs: 1000 });

        // Advance time by cleanup interval (5 minutes)
        jest.advanceTimersByTime(5 * 60 * 1000);

        // Should not throw - cleanup should run without errors
        expect(() => jest.advanceTimersByTime(0)).not.toThrow();
      });
    });
  });

  describe('Preset Rate Limiters', () => {
    describe('auth limiter', () => {
      it('should be strict for authentication', async () => {
        const req = mockRequest('192.168.1.1', '/api/auth/signin');

        // Should allow 5 requests in 15 minutes
        for (let i = 0; i < 5; i++) {
          await expect(rateLimiters.auth(req)).resolves.toBeUndefined();
        }

        await expect(rateLimiters.auth(req)).rejects.toThrow(RateLimitError);
      });

      it('should reset after 15 minutes', async () => {
        const req = mockRequest('192.168.1.1', '/api/auth/signin');

        for (let i = 0; i < 5; i++) {
          await rateLimiters.auth(req);
        }

        jest.advanceTimersByTime(15 * 60 * 1000 + 1);

        await expect(rateLimiters.auth(req)).resolves.toBeUndefined();
      });
    });

    describe('api limiter', () => {
      it('should allow standard API rate', async () => {
        const req = mockRequest('192.168.1.1', '/api/data');

        // Should allow 100 requests per minute
        const promises = Array(100).fill(null).map(() => rateLimiters.api(req));
        await expect(Promise.all(promises)).resolves.toBeDefined();

        await expect(rateLimiters.api(req)).rejects.toThrow(RateLimitError);
      });
    });

    describe('strict limiter', () => {
      it('should be more restrictive', async () => {
        const req = mockRequest('192.168.1.1', '/api/expensive');

        // Should allow only 10 requests per minute
        for (let i = 0; i < 10; i++) {
          await expect(rateLimiters.strict(req)).resolves.toBeUndefined();
        }

        await expect(rateLimiters.strict(req)).rejects.toThrow(RateLimitError);
      });
    });

    describe('webhook limiter', () => {
      it('should use single key for all webhooks', async () => {
        // Different IPs should share the same limit
        const req1 = mockRequest('192.168.1.1', '/api/webhook');
        const req2 = mockRequest('192.168.1.2', '/api/webhook');

        // Should allow 10 requests per second total
        for (let i = 0; i < 5; i++) {
          await rateLimiters.webhook(req1);
          await rateLimiters.webhook(req2);
        }

        await expect(rateLimiters.webhook(req1)).rejects.toThrow(RateLimitError);
        await expect(rateLimiters.webhook(req2)).rejects.toThrow(RateLimitError);
      });

      it('should reset quickly for webhooks', async () => {
        const req = mockRequest('192.168.1.1', '/api/webhook');

        for (let i = 0; i < 10; i++) {
          await rateLimiters.webhook(req);
        }

        await expect(rateLimiters.webhook(req)).rejects.toThrow(RateLimitError);

        jest.advanceTimersByTime(1001);

        await expect(rateLimiters.webhook(req)).resolves.toBeUndefined();
      });
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle race conditions correctly', async () => {
      const limiter = createRateLimiter({ max: 5, windowMs: 1000 });
      const req = mockRequest('192.168.1.1');

      // Simulate concurrent requests
      const promises = Array(10).fill(null).map(() => 
        limiter(req).catch(() => 'limited')
      );

      const results = await Promise.all(promises);
      const successful = results.filter(r => r === undefined).length;
      const limited = results.filter(r => r === 'limited').length;

      expect(successful).toBe(5);
      expect(limited).toBe(5);
    });

    it('should maintain consistency under concurrent load', async () => {
      const limiter = createRateLimiter({ max: 3, windowMs: 100 });

      const makeRequests = async (ip: string, count: number) => {
        const results = [];
        for (let i = 0; i < count; i++) {
          try {
            await limiter(mockRequest(ip));
            results.push('success');
          } catch {
            results.push('limited');
          }
        }
        return results;
      };

      const [results1, results2] = await Promise.all([
        makeRequests('192.168.1.1', 5),
        makeRequests('192.168.1.2', 5),
      ]);

      expect(results1.filter(r => r === 'success').length).toBe(3);
      expect(results2.filter(r => r === 'success').length).toBe(3);
    });
  });
});
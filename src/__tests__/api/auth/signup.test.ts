import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/signup/route';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/client';
import { rateLimiters } from '@/lib/rate-limit';

jest.mock('@/lib/supabase/client');
jest.mock('@/lib/rate-limit');
jest.mock('bcryptjs');

describe('POST /api/auth/signup', () => {
  const mockRequest = (body: any) => ({
    json: async () => body,
    headers: new Headers(),
    nextUrl: { pathname: '/api/auth/signup' },
  } as unknown as NextRequest);

  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimiters.auth as jest.Mock) = jest.fn().mockResolvedValue(undefined);
    (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('hashed_password');
  });

  describe('Happy Path', () => {
    it('should create a human user successfully', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'human',
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({ data: null, error: null }) // No existing user
          .mockResolvedValueOnce({ 
            data: {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User',
              role: 'human',
              created_at: '2024-01-01',
            },
            error: null,
          }),
        insert: jest.fn().mockReturnThis(),
      };
      
      (supabaseAdmin as any) = mockSupabase;

      const response = await POST(mockRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'human',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('Test123!@#', 12);
    });

    it('should create an AI agent user with agent record', async () => {
      const requestBody = {
        email: 'ai@example.com',
        password: 'Test123!@#',
        name: 'AI Agent',
        role: 'ai',
      };

      const mockSupabase = {
        from: jest.fn().mockImplementation((table) => {
          if (table === 'users') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn()
                .mockResolvedValueOnce({ data: null, error: null })
                .mockResolvedValueOnce({
                  data: {
                    id: 'user-456',
                    email: 'ai@example.com',
                    name: 'AI Agent',
                    role: 'ai',
                    created_at: '2024-01-01',
                  },
                  error: null,
                }),
              insert: jest.fn().mockReturnThis(),
            };
          }
          if (table === 'ai_agents') {
            return {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'agent-123', user_id: 'user-456' },
                error: null,
              }),
            };
          }
        }),
      };

      (supabaseAdmin as any) = mockSupabase;

      const response = await POST(mockRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('ai_agents');
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid email format', async () => {
      const response = await POST(mockRequest({
        email: 'not-an-email',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'human',
      }));

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('Invalid email');
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'short',          // Too short
        'alllowercase',   // No uppercase, digits, special chars
        'ALLUPPERCASE',   // No lowercase, digits, special chars
        'NoNumbers!',     // No digits
        'NoSpecial123',   // No special characters
        '12345678',       // Only numbers
        '////////',       // Only special chars
      ];

      for (const password of weakPasswords) {
        const response = await POST(mockRequest({
          email: 'test@example.com',
          password,
          name: 'Test User',
          role: 'human',
        }));

        const data = await response.json();
        expect(response.status).toBe(400);
        expect(data.error).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject invalid names', async () => {
      const invalidNames = [
        '',                                    // Empty
        'A',                                   // Too short
        'A'.repeat(51),                        // Too long
        '   ',                                 // Only whitespace
      ];

      for (const name of invalidNames) {
        const response = await POST(mockRequest({
          email: 'test@example.com',
          password: 'Test123!@#',
          name,
          role: 'human',
        }));

        const data = await response.json();
        expect(response.status).toBe(400);
      }
    });

    it('should reject invalid roles', async () => {
      const response = await POST(mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'invalid_role',
      }));

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('Edge Cases', () => {
    it('should handle existing user conflict', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'existing-user' },
          error: null,
        }),
      };

      (supabaseAdmin as any) = mockSupabase;

      const response = await POST(mockRequest({
        email: 'existing@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'human',
      }));

      const data = await response.json();
      expect(response.status).toBe(409);
      expect(data.error).toBe('CONFLICT');
      expect(data.message).toContain('already exists');
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };

      (supabaseAdmin as any) = mockSupabase;

      const response = await POST(mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'human',
      }));

      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });

    it('should handle rate limiting', async () => {
      (rateLimiters.auth as jest.Mock).mockRejectedValue({
        statusCode: 429,
        message: 'Too many requests',
        code: 'RATE_LIMIT',
      });

      const response = await POST(mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'human',
      }));

      const data = await response.json();
      expect(response.status).toBe(429);
    });

    it('should continue if AI agent creation fails', async () => {
      const mockSupabase = {
        from: jest.fn().mockImplementation((table) => {
          if (table === 'users') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn()
                .mockResolvedValueOnce({ data: null, error: null })
                .mockResolvedValueOnce({
                  data: {
                    id: 'user-789',
                    email: 'ai@example.com',
                    name: 'AI Agent',
                    role: 'ai',
                  },
                  error: null,
                }),
              insert: jest.fn().mockReturnThis(),
            };
          }
          if (table === 'ai_agents') {
            return {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockRejectedValue(new Error('Agent creation failed')),
            };
          }
        }),
      };

      (supabaseAdmin as any) = mockSupabase;

      const response = await POST(mockRequest({
        email: 'ai@example.com',
        password: 'Test123!@#',
        name: 'AI Agent',
        role: 'ai',
      }));

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Security', () => {
    it('should sanitize input to prevent XSS', async () => {
      const response = await POST(mockRequest({
        email: '<script>alert("xss")</script>test@example.com',
        password: 'Test123!@#',
        name: '<img src=x onerror=alert(1)>Test User',
        role: 'human',
      }));

      const data = await response.json();
      expect(response.status).toBe(400);
    });

    it('should not expose sensitive information in errors', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('password_hash column not found')),
      };

      (supabaseAdmin as any) = mockSupabase;

      const response = await POST(mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'human',
      }));

      const data = await response.json();
      expect(data.message).not.toContain('password_hash');
      expect(data.message).not.toContain('column');
    });

    it('should hash passwords with correct salt rounds', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({ data: null, error: null })
          .mockResolvedValueOnce({
            data: {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User',
              role: 'human',
            },
            error: null,
          }),
        insert: jest.fn().mockReturnThis(),
      };

      (supabaseAdmin as any) = mockSupabase;

      await POST(mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'human',
      }));

      expect(bcrypt.hash).toHaveBeenCalledWith('Test123!@#', 12);
    });
  });

  describe('Concurrency', () => {
    it('should handle concurrent signup attempts', async () => {
      let callCount = 0;
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: { id: 'existing-user' }, error: null });
        }),
        insert: jest.fn().mockReturnThis(),
      };

      (supabaseAdmin as any) = mockSupabase;

      const requests = Array(3).fill(null).map(() =>
        POST(mockRequest({
          email: 'concurrent@example.com',
          password: 'Test123!@#',
          name: 'Test User',
          role: 'human',
        }))
      );

      const responses = await Promise.all(requests);
      const statuses = responses.map(r => r.status);

      expect(statuses.filter(s => s === 200).length).toBeLessThanOrEqual(1);
      expect(statuses.filter(s => s === 409).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({ data: null, error: null })
          .mockResolvedValueOnce({
            data: {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User',
              role: 'human',
            },
            error: null,
          }),
        insert: jest.fn().mockReturnThis(),
      };

      (supabaseAdmin as any) = mockSupabase;

      const start = Date.now();
      await POST(mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'human',
      }));
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });
  });
});
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { POST } from '@/app/api/auth/signup/route';
import { supabaseAdmin } from '@/lib/supabase/client';
import { rateLimiters } from '@/lib/rate-limit';

jest.mock('@/lib/supabase/client', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
  safeDbOperation: jest.fn(async (operation: () => Promise<{ data: unknown; error: unknown }>) => {
    try {
      const result = await operation();
      return {
        data: (result as any).data ?? null,
        error: (result as any).error?.message ?? (result as any).error ?? null,
        success: !(result as any).error,
        retries: 0,
      };
    } catch (error: any) {
      return {
        data: null,
        error: error?.message ?? 'Unknown error',
        success: false,
        retries: 0,
      };
    }
  }),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    auth: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('POST /api/auth/signup', () => {
  const mockRequest = (body: unknown) =>
    ({
      json: async () => body,
      headers: new Headers(),
      nextUrl: { pathname: '/api/auth/signup' },
    }) as unknown as NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimiters.auth as jest.Mock).mockResolvedValue(undefined);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  it('creates a human user', async () => {
    const usersLookupQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    const usersInsertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-123', email: 'test@example.com', name: 'Test User', role: 'human' },
        error: null,
      }),
    };

    (supabaseAdmin.from as jest.Mock)
      .mockReturnValueOnce(usersLookupQuery)
      .mockReturnValueOnce(usersInsertQuery);

    const response = await POST(
      mockRequest({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
        role: 'human',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('test@example.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('Test123!', 12);
  });

  it('rejects duplicate users', async () => {
    const usersLookupQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'existing-user' }, error: null }),
    };
    (supabaseAdmin.from as jest.Mock).mockReturnValue(usersLookupQuery);

    const response = await POST(
      mockRequest({
        email: 'existing@example.com',
        password: 'Test123!',
        name: 'Existing User',
        role: 'human',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('CONFLICT');
  });

  it('returns validation errors for invalid payloads', async () => {
    const response = await POST(
      mockRequest({
        email: 'invalid-email',
        password: 'weak',
        name: 'A',
        role: 'nope',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('continues signup when AI agent record insert fails', async () => {
    const usersLookupQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    const usersInsertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'ai-user', email: 'ai@example.com', name: 'AI Agent', role: 'ai' },
        error: null,
      }),
    };
    const aiAgentInsertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'agent insert failed' },
      }),
    };

    (supabaseAdmin.from as jest.Mock)
      .mockReturnValueOnce(usersLookupQuery)
      .mockReturnValueOnce(usersInsertQuery)
      .mockReturnValueOnce(aiAgentInsertQuery);

    const response = await POST(
      mockRequest({
        email: 'ai@example.com',
        password: 'Test123!',
        name: 'AI Agent',
        role: 'ai',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
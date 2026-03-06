import { NextRequest } from 'next/server';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';
import { authSchemas, validateRequest } from '@/lib/validation';
import { ConflictError, handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';

const BCRYPT_ROUNDS = 12;
const AI_AGENT_DEFAULTS = {
  agent_type: 'custom',
  capabilities: ['hotkey_creation', 'marketplace_access'],
  rate_limit: 1000,
  is_active: true,
} as const;

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    await rateLimiters.auth(request);
    
    // Parse and validate request
    const body = await request.json();
    const data = await validateRequest(authSchemas.signup, body);
    
    logger.info({ 
      type: 'auth_signup',
      email: data.email, 
      role: data.role 
    });
    
    // Check for existing user
    const existingUser = await safeDbOperation(() => 
      supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single()
    );
    
    if (existingUser.success && existingUser.data) {
      throw new ConflictError('User already exists with this email');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    
    // Create user transaction
    const userResult = await safeDbOperation(() => 
      supabaseAdmin
        .from('users')
        .insert({
          email: data.email,
          name: data.name,
          password_hash: passwordHash,
          role: data.role,
          is_verified: false,
        })
        .select('id, email, name, role, created_at')
        .single()
    );
    
    if (!userResult.success || !userResult.data) {
      throw new Error('Failed to create user account');
    }
    
    const user = userResult.data;
    
    // Create AI agent record if needed
    if (data.role === 'ai' && user.id) {
      const agentResult = await safeDbOperation(() => 
        supabaseAdmin
          .from('ai_agents')
          .insert({
            user_id: user.id,
            agent_name: data.name,
            ...AI_AGENT_DEFAULTS,
          })
          .select()
          .single()
      );
      
      if (!agentResult.success) {
        logger.warn({ 
          type: 'agent_creation_failed',
          userId: user.id,
          error: agentResult.error 
        });
      }
    }
    
    logger.info({ 
      type: 'user_created',
      userId: user.id,
      role: user.role 
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: 'Account created successfully',
    });
    
  } catch (error) {
    return handleApiError(error, { endpoint: '/api/auth/signup' });
  }
}
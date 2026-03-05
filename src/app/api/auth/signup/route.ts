import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const SignUpSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['human', 'ai_agent']).default('human'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[AUTH] Signup attempt:', { email: body.email, role: body.role });
    
    // Validate input
    const validatedData = SignUpSchema.parse(body);
    
    // Check if user already exists
    const existingUserResult = await safeDbOperation(async () => {
      return await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', validatedData.email)
        .single();
    });
    
    if (existingUserResult.success && existingUserResult.data) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);
    
    // Create user
    const createUserResult = await safeDbOperation(async () => {
      return await supabaseAdmin
        .from('users')
        .insert({
          email: validatedData.email,
          name: validatedData.name,
          password_hash: passwordHash,
          role: validatedData.role,
          is_verified: false,
        })
        .select('id, email, name, role, created_at')
        .single();
    });
    
    if (!createUserResult.success) {
      console.error('[AUTH] User creation failed:', createUserResult.error);
      return NextResponse.json(
        { 
          error: 'Failed to create user account',
          message: 'Database error occurred during signup',
          dev_error: createUserResult.error
        },
        { status: 500 }
      );
    }
    
    const user = createUserResult.data;
    if (!user) {
      return NextResponse.json(
        { error: 'User creation failed - no data returned' },
        { status: 500 }
      );
    }
    
    // If AI agent, create agent record
    if (validatedData.role === 'ai_agent') {
      const agentResult = await safeDbOperation(async () => {
        return await supabaseAdmin
          .from('ai_agents')
          .insert({
            user_id: (user as any).id,
            agent_name: validatedData.name,
            agent_type: 'custom',
            capabilities: ['hotkey_creation', 'marketplace_access'],
            rate_limit: 1000,
            is_active: true,
          })
          .select()
          .single();
      });
      
      if (!agentResult.success) {
        console.error('[AUTH] Agent creation failed:', agentResult.error);
        // Don't fail the entire signup for this
      }
    }
    
    console.log('[AUTH] User created successfully:', { userId: (user as any).id, role: (user as any).role });
    
    return NextResponse.json({
      success: true,
      user: {
        id: (user as any).id,
        email: (user as any).email,
        name: (user as any).name,
        role: (user as any).role,
      },
      message: 'Account created successfully',
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }
    
    console.error('[AUTH] Signup error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred during signup'
      },
      { status: 500 }
    );
  }
}
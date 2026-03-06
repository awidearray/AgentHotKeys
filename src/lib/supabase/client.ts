import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, validateEnvironment } from '@/lib/env';

// Safely validate environment
let isValid = true;
let errors: string[] = [];

try {
  const validation = validateEnvironment();
  if (validation) {
    isValid = validation.isValid;
    errors = validation.errors;
  }
} catch (error) {
  errors = ['Environment validation failed'];
}

if (!isValid) {
  console.warn('⚠️  Supabase configuration issues detected:', errors);
}

// Create clients with proper error handling
export const supabase: SupabaseClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'hotkeys-ai/1.0.0',
      },
    },
  }
);

export const supabaseAdmin: SupabaseClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'hotkeys-ai-admin/1.0.0',
      },
    },
  }
);

// Database health check
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string; latency: number }> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    const latency = Date.now() - startTime;
      
    if (error) {
      return { healthy: false, error: error.message, latency };
    }
    
    return { healthy: true, latency };
  } catch (err) {
    const latency = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return { healthy: false, error: message, latency };
  }
}

// Safe database operation wrapper
export async function safeDbOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null; success: boolean }> {
  try {
    const result = await operation();
    
    if (result.error) {
      console.error('Database error:', result.error);
      return {
        data: null,
        error: result.error.message || 'Database operation failed',
        success: false,
      };
    }
    
    return {
      data: result.data,
      error: null,
      success: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Database operation exception:', err);
    return {
      data: null,
      error: message,
      success: false,
    };
  }
}
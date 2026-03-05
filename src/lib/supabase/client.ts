import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, validateEnvironment } from '@/lib/env';

const { isValid, errors } = validateEnvironment();

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
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (error) {
      return { healthy: false, error: error.message };
    }
    
    return { healthy: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return { healthy: false, error: message };
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
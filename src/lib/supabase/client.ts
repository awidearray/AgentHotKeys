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

// Safe database operation wrapper with retry logic
export async function safeDbOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<{ data: T | null; error: string | null; success: boolean; retries: number }> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      if (result.error) {
        lastError = result.error;
        
        // Don't retry on certain types of errors
        const errorMessage = result.error.message || '';
        const isRetryableError = !errorMessage.includes('duplicate key') && 
                               !errorMessage.includes('foreign key') &&
                               !errorMessage.includes('permission denied') &&
                               !errorMessage.includes('authorization');
        
        if (!isRetryableError || attempt === maxRetries) {
          console.error(`Database error (attempt ${attempt + 1}/${maxRetries + 1}):`, result.error);
          return {
            data: null,
            error: result.error.message || 'Database operation failed',
            success: false,
            retries: attempt,
          };
        }
        
        // Wait before retrying
        if (attempt < maxRetries) {
          console.warn(`Database operation failed, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries + 1}):`, result.error.message);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
      }
      
      return {
        data: result.data,
        error: null,
        success: true,
        retries: attempt,
      };
    } catch (err) {
      lastError = err;
      
      if (attempt === maxRetries) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Database operation exception (attempt ${attempt + 1}/${maxRetries + 1}):`, err);
        return {
          data: null,
          error: message,
          success: false,
          retries: attempt,
        };
      }
      
      // Wait before retrying
      console.warn(`Database operation exception, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries + 1}):`, err);
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
  
  // This should never be reached, but just in case
  const message = lastError instanceof Error ? lastError.message : 'Unknown error';
  return {
    data: null,
    error: message,
    success: false,
    retries: maxRetries,
  };
}
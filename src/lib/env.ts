import { z } from 'zod';

const envSchema = z.object({
  // Core App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // Database
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Valid Supabase URL required'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100, 'Valid Supabase anon key required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100, 'Valid Supabase service role key required'),

  // OAuth (Optional in development)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(), 
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Web3 (Required for crypto payments)
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string().min(32, 'Valid WalletConnect project ID required'),
  NEXT_PUBLIC_ALCHEMY_ID: z.string().min(32, 'Valid Alchemy API key required'),

  // Platform Wallets
  PLATFORM_ETH_WALLET: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Valid ETH wallet address required'),
  PLATFORM_MATIC_WALLET: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Valid MATIC wallet address required'),
  PLATFORM_USDC_WALLET: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Valid USDC wallet address required'),

  // Payments
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Valid Stripe secret key required'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Valid Stripe webhook secret required'),
  
  // Email
  BREVO_API_KEY: z.string().startsWith('xkeysib-', 'Valid Brevo API key required'),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment validation failed:');
  if (error instanceof z.ZodError) {
    console.error(error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n'));
  }
  
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
  
  // In development, provide fallback warning
  console.warn('⚠️  Using development fallbacks. Platform functionality will be limited.');
  
  env = {
    NODE_ENV: 'development',
    NEXTAUTH_URL: 'http://localhost:3000', 
    NEXTAUTH_SECRET: 'development-secret-key-minimum-32-characters-long',
    NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.placeholder',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.placeholder-service',
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: 'placeholder-project-id-min-32-chars',
    NEXT_PUBLIC_ALCHEMY_ID: 'placeholder-alchemy-id-min-32-chars',
    PLATFORM_ETH_WALLET: '0x0000000000000000000000000000000000000000',
    PLATFORM_MATIC_WALLET: '0x0000000000000000000000000000000000000000', 
    PLATFORM_USDC_WALLET: '0x0000000000000000000000000000000000000000',
    STRIPE_SECRET_KEY: 'sk_test_placeholder',
    STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
    BREVO_API_KEY: 'xkeysib-placeholder',
  } as Env;
}

export { env };

export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for placeholder values
  if (env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    errors.push('Supabase URL is not configured');
  }
  
  if (env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID.includes('placeholder')) {
    errors.push('WalletConnect project ID is not configured');
  }
  
  if (env.STRIPE_SECRET_KEY.includes('placeholder')) {
    errors.push('Stripe configuration is not complete');
  }
  
  if (env.PLATFORM_ETH_WALLET === '0x0000000000000000000000000000000000000000') {
    errors.push('Platform wallet addresses are not configured');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
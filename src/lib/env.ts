import { z } from 'zod';

// Check if we should skip validation (for deployment builds)
const skipValidation = process.env.SKIP_ENV_VALIDATION === 'true';

// Helper to create optional string with fallback
const optionalString = (fallback?: string) => 
  skipValidation ? z.string().optional().default(fallback || '') : z.string();

// Helper to create optional string with pattern
const optionalPattern = (pattern: RegExp, fallback: string) =>
  skipValidation ? z.string().optional().default(fallback) : z.string().regex(pattern);

const envSchema = z.object({
  // Core App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXTAUTH_URL: optionalString('http://localhost:3000'),
  NEXTAUTH_SECRET: optionalString('development-secret-key-minimum-32-characters-long'),

  // Database
  NEXT_PUBLIC_SUPABASE_URL: optionalString('https://placeholder.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.placeholder'),
  SUPABASE_SERVICE_ROLE_KEY: optionalString('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.placeholder-service'),

  // OAuth (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(), 
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Web3 
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: optionalString('placeholder-project-id-min-32-chars'),
  NEXT_PUBLIC_ALCHEMY_ID: optionalString('placeholder-alchemy-id-min-32-chars'),

  // Platform Wallets
  PLATFORM_ETH_WALLET: optionalPattern(/^0x[a-fA-F0-9]{40}$/, '0x0000000000000000000000000000000000000000'),
  PLATFORM_MATIC_WALLET: optionalPattern(/^0x[a-fA-F0-9]{40}$/, '0x0000000000000000000000000000000000000000'),
  PLATFORM_USDC_WALLET: optionalPattern(/^0x[a-fA-F0-9]{40}$/, '0x0000000000000000000000000000000000000000'),

  // Payments
  STRIPE_SECRET_KEY: optionalString('sk_test_placeholder'),
  STRIPE_WEBHOOK_SECRET: optionalString('whsec_placeholder'),
  NEXT_PUBLIC_STRIPE_PAYMENT_LINK: z.string().optional(),
  
  // Email
  BREVO_API_KEY: optionalString('xkeysib-placeholder'),
  BREVO_LIST_ID: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().optional(),
  BREVO_SENDER_NAME: z.string().optional(),
  
  // Platform
  SITE_URL: z.string().optional(),
  ADMIN_SECRET_TOKEN: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
  
  if (skipValidation) {
    console.log('⚠️  Environment validation skipped (SKIP_ENV_VALIDATION=true)');
    console.log('⚠️  Using placeholder values for missing environment variables');
  }
} catch (error) {
  if (!skipValidation && process.env.NODE_ENV === 'production') {
    console.error('❌ Environment validation failed in production:');
    if (error instanceof z.ZodError) {
      console.error(error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n'));
    }
    process.exit(1);
  }
  
  // In development or with skip validation, provide defaults
  console.warn('⚠️  Using development fallbacks. Platform functionality will be limited.');
  
  env = {
    NODE_ENV: process.env.NODE_ENV as any || 'development',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000', 
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret-key-minimum-32-characters-long',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.placeholder',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.placeholder-service',
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'placeholder-project-id-min-32-chars',
    NEXT_PUBLIC_ALCHEMY_ID: process.env.NEXT_PUBLIC_ALCHEMY_ID || 'placeholder-alchemy-id-min-32-chars',
    PLATFORM_ETH_WALLET: process.env.PLATFORM_ETH_WALLET || '0x0000000000000000000000000000000000000000',
    PLATFORM_MATIC_WALLET: process.env.PLATFORM_MATIC_WALLET || '0x0000000000000000000000000000000000000000', 
    PLATFORM_USDC_WALLET: process.env.PLATFORM_USDC_WALLET || '0x0000000000000000000000000000000000000000',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
    NEXT_PUBLIC_STRIPE_PAYMENT_LINK: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK,
    BREVO_API_KEY: process.env.BREVO_API_KEY || 'xkeysib-placeholder',
    BREVO_LIST_ID: process.env.BREVO_LIST_ID,
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
    BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME,
    SITE_URL: process.env.SITE_URL,
    ADMIN_SECRET_TOKEN: process.env.ADMIN_SECRET_TOKEN,
  } as Env;
}

export { env };

export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Skip validation if env is not properly initialized (e.g., in tests)
  if (!env || typeof env !== 'object') {
    return {
      isValid: true,
      errors: ['Environment validation skipped']
    };
  }
  
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
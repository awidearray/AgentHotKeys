# Production Deployment Guide

This guide covers deploying the AI Hotkeys Marketplace to production.

## Prerequisites

- Supabase project with database setup
- Stripe account for payments
- WalletConnect project ID for Web3 features
- Alchemy API key for blockchain interactions

## Environment Variables

### Required Variables

Set these in your deployment platform:

```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication  
NEXTAUTH_SECRET=your-32-char-secret-key
NEXTAUTH_URL=https://your-domain.com

# Admin Access
ADMIN_SECRET_TOKEN=your-admin-secret-token

# Web3
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-wallet-connect-id
NEXT_PUBLIC_ALCHEMY_ID=your-alchemy-api-key

# Payments
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/your-link

# Platform Configuration
SITE_URL=https://your-domain.com
PLATFORM_ETH_WALLET=0xYourEthereumWallet
PLATFORM_MATIC_WALLET=0xYourPolygonWallet
PLATFORM_USDC_WALLET=0xYourUSDCWallet
```

### Optional Variables

```bash
# Email Service (Brevo)
BREVO_API_KEY=your-brevo-api-key
BREVO_LIST_ID=your-list-id
BREVO_PURCHASERS_LIST_ID=your-purchasers-list-id
BREVO_SENDER_EMAIL=no-reply@your-domain.com
BREVO_SENDER_NAME=Your App Name

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Database Setup

1. **Create Supabase Project**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref your-project-ref
   ```

2. **Run Migrations**
   ```bash
   # Push migrations to production
   supabase db push
   ```

3. **Enable Row Level Security**
   - All tables have RLS enabled by default
   - Policies are configured in the migration files

## Platform-Specific Deployment

### Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   # Set environment variables
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   # ... add all required variables
   
   # Deploy
   vercel --prod
   ```

### Railway

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway link
   railway up
   ```

2. **Set Environment Variables**
   - Use Railway dashboard or CLI to set variables

### Cloudflare Pages

1. **Build Configuration**
   ```bash
   # Build command
   npm run build
   
   # Output directory
   .next
   ```

2. **Environment Variables**
   - Set in Cloudflare Pages dashboard
   - Use the `.env.production` template

### Netlify

1. **Build Settings**
   ```bash
   # Build command
   npm run build
   
   # Publish directory
   .next
   ```

2. **Netlify Configuration**
   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

## Post-Deployment Checklist

### Database Verification
- [ ] All migrations applied successfully
- [ ] RLS policies are active
- [ ] Test data can be inserted/queried

### API Endpoints Testing
- [ ] Health check: `/api/health`
- [ ] Authentication: `/api/auth/signup`
- [ ] Hotkeys API: `/api/hotkeys`
- [ ] AI Agent APIs: `/api/ai-agent/*`
- [ ] Payment processing: Test with Stripe

### Security Configuration
- [ ] HTTPS enabled and working
- [ ] Environment variables secured
- [ ] Admin endpoints protected
- [ ] Rate limiting active

### Web3 Integration
- [ ] WalletConnect working
- [ ] Alchemy API responding
- [ ] Crypto wallet connections functional

### Monitoring Setup
- [ ] Error logging configured
- [ ] Performance monitoring
- [ ] Database connection monitoring
- [ ] API endpoint monitoring

## Troubleshooting

### Common Issues

1. **Dependency Resolution Errors**
   ```
   Error: ERESOLVE could not resolve (wagmi/rainbowkit conflict)
   Solution: Use --legacy-peer-deps flag or .npmrc configuration
   npm ci --legacy-peer-deps
   ```

2. **Environment Validation Errors**
   ```
   Solution: Set SKIP_ENV_VALIDATION=true for development
   For production: Ensure all required variables are set
   ```

2. **Database Connection Issues**
   ```
   Solution: Verify Supabase URL and keys
   Check RLS policies and user permissions
   ```

3. **Build Failures**
   ```
   Solution: Run npm run build locally first
   Check for TypeScript errors
   Verify all dependencies are installed
   ```

4. **API Errors in Production**
   ```
   Solution: Check server logs
   Verify environment variables
   Test database connectivity
   ```

## Maintenance

### Database Backups
- Supabase provides automatic backups
- Consider additional backup strategies for critical data

### Monitoring
- Monitor API response times
- Track database performance
- Watch for rate limiting triggers
- Monitor error rates

### Updates
- Test changes in staging environment
- Use database migrations for schema changes
- Backup before major updates

## Support

For deployment issues:
1. Check logs in your deployment platform
2. Verify environment variables are set correctly
3. Test API endpoints individually
4. Check Supabase dashboard for database issues
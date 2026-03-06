# Railway Deployment Setup

## Required Environment Variables

Set these in your Railway project settings:

### Core Application (REQUIRED)
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXTAUTH_URL=https://your-railway-domain.railway.app
NEXTAUTH_SECRET=your-32-character-secret-key-here
```

### Minimum Required for Basic Deployment
```
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=development-secret-key-minimum-32-characters-long
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
SUPABASE_SERVICE_ROLE_KEY=placeholder
STRIPE_SECRET_KEY=placeholder
BREVO_API_KEY=placeholder
```

### Database (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Payments (Stripe)
```
STRIPE_SECRET_KEY=sk_live_or_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/your-link
```

### Email (Brevo)
```
BREVO_API_KEY=xkeysib-your-api-key
BREVO_LIST_ID=your-contact-list-id
BREVO_SENDER_EMAIL=your-sender@domain.com
BREVO_SENDER_NAME=Your App Name
```

### Web3 (Optional)
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-walletconnect-project-id
NEXT_PUBLIC_ALCHEMY_ID=your-alchemy-api-key
PLATFORM_ETH_WALLET=0xYourEthereumWalletAddress
PLATFORM_MATIC_WALLET=0xYourPolygonWalletAddress
PLATFORM_USDC_WALLET=0xYourUSDCWalletAddress
```

### OAuth (Optional)
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Platform
```
SITE_URL=https://your-railway-domain.railway.app
ADMIN_SECRET_TOKEN=your-admin-secret-token
```

## Build Configuration

The project is configured with:
- ✅ Standalone output for Railway
- ✅ Node.js 18+ requirement
- ✅ Health check endpoint at `/api/health`
- ✅ Webpack optimizations

## Deployment Command

```bash
railway up
```

## Troubleshooting

1. **Build fails**: Check that all required environment variables are set
2. **App crashes**: Check logs for missing environment variables
3. **Database issues**: Verify Supabase keys and URL
4. **Payment issues**: Verify Stripe webhook URL matches Railway domain

## Health Check

After deployment, verify:
- Health endpoint: `https://your-domain.railway.app/api/health`
- Should return 200 status with system information

## Post-Deployment

1. Set up Stripe webhooks pointing to your Railway domain
2. Configure custom domain (optional)
3. Set up monitoring/alerting
4. Test all critical user flows
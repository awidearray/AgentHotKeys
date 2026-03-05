# HotKeys.ai Platform - Local Testing Guide

## 🚀 Platform is Running!

Your development server is now running at: **http://localhost:3001**

## 📍 Key Pages to Test

### Public Pages (No Auth Required)
- **Homepage**: http://localhost:3001 - Original landing page
- **Marketplace**: http://localhost:3001/marketplace - Browse hotkeys (demo mode)
- **Sign Up**: http://localhost:3001/auth/signup - Create an account
- **Sign In**: http://localhost:3001/auth/signin - Login to platform

### Protected Pages (Auth Required)
- **Dashboard**: http://localhost:3001/dashboard - User control panel
- **My Hotkeys**: http://localhost:3001/dashboard/hotkeys - Manage your creations
- **Purchases**: http://localhost:3001/dashboard/purchases - View bought items
- **AI Agent Settings**: http://localhost:3001/dashboard/agent - Configure AI access

## 🧪 Testing the Platform

### 1. Create an Account
1. Visit http://localhost:3001/auth/signup
2. Choose "Human Creator" or "AI Agent"
3. Enter test credentials:
   - Name: Test User
   - Email: test@example.com
   - Password: testpass123

### 2. Sign In
1. Visit http://localhost:3001/auth/signin
2. Use the credentials from signup
3. Note: In demo mode, auth is simulated

### 3. Explore Features
- **Browse Marketplace**: See the hotkeys listing page
- **Dashboard**: Access user management area
- **Wallet Connect**: Test Web3 integration (requires MetaMask)

## ⚠️ Demo Mode Limitations

Since we're using demo/mock values:
- **Supabase**: Database operations will fail (no real DB)
- **Auth**: Sessions are simulated locally
- **Payments**: Stripe/crypto payments are mocked
- **Data**: Nothing persists between sessions

## 🔧 To Enable Full Features

1. **Set up Supabase**:
   - Create project at https://supabase.com
   - Run the schema from `/supabase/schema.sql`
   - Update `.env.local` with real credentials

2. **Configure OAuth**:
   - Set up Google OAuth in Google Console
   - Set up GitHub OAuth in GitHub Settings
   - Add credentials to `.env.local`

3. **Web3 Setup**:
   - Get WalletConnect Project ID
   - Get Alchemy API key
   - Update `.env.local`

## 🎨 Platform Architecture

```
Frontend (Next.js)
    ↓
Authentication (NextAuth.js)
    ↓
API Routes (/api/*)
    ↓
Database (Supabase)
    ↓
Services:
- Stripe (Fiat payments)
- Web3 (Crypto payments)
- Security Validator
```

## 📱 Key Features Implemented

✅ Multi-role authentication (Humans & AI Agents)
✅ Hotkey marketplace with search/filter
✅ Security validation system (0-100 scoring)
✅ Crypto wallet integration
✅ Dashboard for creators
✅ API endpoints for CRUD operations
✅ Subscription system ($2/month hosting)
✅ Review and rating system

## 🛠 Development Commands

- **Stop server**: Press Ctrl+C in terminal
- **Restart server**: `npm run dev`
- **Build for production**: `npm run build`
- **Deploy to Cloudflare**: `npm run deploy`

## 📝 Next Steps

1. Replace demo credentials with real services
2. Deploy database schema to Supabase
3. Set up payment processing (Stripe + crypto)
4. Add community forum integration
5. Implement email notifications
6. Deploy to production

---

**Platform is ready for testing at http://localhost:3001** 🎉
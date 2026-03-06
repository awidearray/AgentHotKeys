#!/bin/bash

# Production Deployment Setup Script
# Configures environment variables and builds the application

set -e

echo "🚀 Starting production deployment setup..."

# Check if required environment variables are set
required_vars=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY" 
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXTAUTH_SECRET"
    "DEPLOY_URL"
)

echo "📋 Checking required environment variables..."
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "💡 Set these variables in your deployment platform:"
    echo "   - Vercel: vercel env add"
    echo "   - Netlify: Site settings > Environment variables" 
    echo "   - Railway: Variables tab"
    echo "   - Cloudflare Pages: Settings > Environment variables"
    exit 1
fi

echo "✅ All required environment variables are set"

# Run database migrations if in CI/CD
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
    echo "🗄️  Running database migrations..."
    if command -v npx &> /dev/null; then
        # Install Supabase CLI if not available
        if ! command -v supabase &> /dev/null; then
            echo "📦 Installing Supabase CLI..."
            npm install -g supabase
        fi
        
        # Run migrations
        supabase db push --password "$SUPABASE_DB_PASSWORD" || echo "⚠️  Migration skipped (manual setup required)"
    fi
fi

# Install dependencies with legacy peer deps
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

# Build the application
echo "🔨 Building application..."
npm run build

# Validate the build
if [ -d ".next" ] || [ -d "dist" ] || [ -d "build" ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed - no output directory found"
    exit 1
fi

echo "🎉 Deployment setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Deploy the built application to your platform"
echo "   2. Set up your Supabase database with the migration files"
echo "   3. Configure domain and SSL certificates"
echo "   4. Test the deployed application"
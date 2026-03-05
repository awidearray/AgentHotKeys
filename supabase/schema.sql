-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum
CREATE TYPE user_role AS ENUM ('human', 'ai_agent', 'admin');
CREATE TYPE hotkey_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'archived');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');

-- Users table (extends NextAuth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    name TEXT,
    password_hash TEXT,
    role user_role DEFAULT 'human',
    wallet_address TEXT,
    api_key TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    github_username TEXT,
    reputation_score INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agents table
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    agent_type TEXT, -- 'claude', 'gpt', 'custom', etc.
    capabilities TEXT[],
    rate_limit INTEGER DEFAULT 1000, -- requests per day
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotkeys table
CREATE TABLE hotkeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[],
    price_usd DECIMAL(10, 2),
    price_crypto JSONB, -- {"ETH": 0.01, "SOL": 1.5, etc}
    is_free BOOLEAN DEFAULT false,
    version TEXT DEFAULT '1.0.0',
    status hotkey_status DEFAULT 'draft',
    content JSONB NOT NULL, -- The actual hotkey configuration
    preview_content JSONB, -- Limited preview for non-buyers
    compatibility TEXT[], -- ['vs-code', 'cursor', 'claude-code', etc]
    downloads INTEGER DEFAULT 0,
    rating_average DECIMAL(3, 2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    security_score INTEGER, -- 0-100 from validation
    security_report JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Hotkey versions (for updates)
CREATE TABLE hotkey_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotkey_id UUID REFERENCES hotkeys(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    content JSONB NOT NULL,
    changelog TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases table
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    hotkey_id UUID REFERENCES hotkeys(id) ON DELETE CASCADE,
    transaction_hash TEXT, -- For crypto payments
    stripe_payment_intent TEXT, -- For fiat payments
    amount_usd DECIMAL(10, 2),
    amount_crypto JSONB,
    payment_method TEXT, -- 'stripe', 'eth', 'sol', etc
    status transaction_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(buyer_id, hotkey_id)
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotkey_id UUID REFERENCES hotkeys(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotkey_id, reviewer_id)
);

-- Subscriptions table (for $2/month hosting)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    crypto_subscription_hash TEXT,
    status subscription_status DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ
);

-- Platform analytics
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotkey_id UUID REFERENCES hotkeys(id) ON DELETE CASCADE,
    event_type TEXT, -- 'view', 'download', 'execute', etc
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_hash TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security audit log
CREATE TABLE security_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotkey_id UUID REFERENCES hotkeys(id) ON DELETE CASCADE,
    audit_type TEXT, -- 'automated', 'manual', 'user_report'
    severity TEXT, -- 'info', 'warning', 'critical'
    findings JSONB,
    auditor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum/Community tables
CREATE TABLE forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_hotkeys_creator ON hotkeys(creator_id);
CREATE INDEX idx_hotkeys_status ON hotkeys(status);
CREATE INDEX idx_hotkeys_category ON hotkeys(category);
CREATE INDEX idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX idx_purchases_hotkey ON purchases(hotkey_id);
CREATE INDEX idx_reviews_hotkey ON reviews(hotkey_id);
CREATE INDEX idx_analytics_hotkey ON analytics(hotkey_id);
CREATE INDEX idx_analytics_created ON analytics(created_at);

-- Row Level Security policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (to be expanded)
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (auth.uid()::uuid = id);

CREATE POLICY "Public hotkeys are viewable by everyone" ON hotkeys
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can manage own hotkeys" ON hotkeys
    FOR ALL USING (auth.uid()::uuid = creator_id);

CREATE POLICY "Users can view own purchases" ON purchases
    FOR SELECT USING (auth.uid()::uuid = buyer_id);
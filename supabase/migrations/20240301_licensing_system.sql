-- Licensing System Tables

-- License tiers enum
CREATE TYPE license_tier AS ENUM ('basic', 'pro', 'team', 'enterprise');

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier license_tier NOT NULL DEFAULT 'basic',
  pack_ids UUID[] DEFAULT '{}',
  max_devices INTEGER DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoke_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Creator attribution
  creator_id UUID REFERENCES users(id),
  creator_type user_role,
  reseller_id UUID REFERENCES users(id),
  
  -- Metadata
  stripe_payment_id VARCHAR(255),
  purchase_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Attribution metadata
  creator_name VARCHAR(255),
  creator_avatar_url TEXT,
  attribution_required BOOLEAN DEFAULT TRUE,
  
  -- Indexes
  INDEX idx_licenses_user_id (user_id),
  INDEX idx_licenses_key (key),
  INDEX idx_licenses_expires_at (expires_at),
  INDEX idx_licenses_creator_id (creator_id),
  INDEX idx_licenses_reseller_id (reseller_id)
);

-- License activations table
CREATE TABLE IF NOT EXISTS license_activations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_info JSONB,
  active BOOLEAN DEFAULT TRUE,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deactivated_at TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for license-device combination
  UNIQUE(license_id, device_id),
  
  -- Indexes
  INDEX idx_activations_license_id (license_id),
  INDEX idx_activations_device_id (device_id),
  INDEX idx_activations_active (active)
);

-- Hotkey packs table
CREATE TABLE IF NOT EXISTS hotkey_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10, 2),
  hotkeys JSONB NOT NULL DEFAULT '[]',
  version VARCHAR(50) DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2),
  
  -- Indexes
  INDEX idx_packs_category (category),
  INDEX idx_packs_active (is_active)
);

-- License usage tracking
CREATE TABLE IF NOT EXISTS license_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activation_id UUID REFERENCES license_activations(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  hotkey_id VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  
  -- Indexes
  INDEX idx_usage_activation_id (activation_id),
  INDEX idx_usage_timestamp (timestamp),
  INDEX idx_usage_action (action)
);

-- Fraud detection table
CREATE TABLE IF NOT EXISTS license_fraud_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  device_ids TEXT[],
  ip_addresses INET[],
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Indexes
  INDEX idx_fraud_license_id (license_id),
  INDEX idx_fraud_severity (severity),
  INDEX idx_fraud_resolved (resolved)
);

-- Functions

-- Generate unique license key
CREATE OR REPLACE FUNCTION generate_license_key()
RETURNS VARCHAR(255) AS $$
DECLARE
  chars VARCHAR(62) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(255) := '';
  i INTEGER;
BEGIN
  -- Format: XXXX-XXXX-XXXX-XXXX
  FOR i IN 1..16 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    IF i % 4 = 0 AND i < 16 THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Check license validity
CREATE OR REPLACE FUNCTION check_license_validity(p_license_key VARCHAR(255))
RETURNS TABLE (
  is_valid BOOLEAN,
  reason TEXT,
  license_id UUID,
  tier license_tier,
  active_devices INTEGER,
  max_devices INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH license_info AS (
    SELECT 
      l.id,
      l.tier,
      l.max_devices,
      l.expires_at,
      l.revoked,
      COUNT(la.id) FILTER (WHERE la.active = TRUE) AS active_count
    FROM licenses l
    LEFT JOIN license_activations la ON l.id = la.license_id
    WHERE l.key = p_license_key
    GROUP BY l.id
  )
  SELECT 
    CASE 
      WHEN li.id IS NULL THEN FALSE
      WHEN li.revoked THEN FALSE
      WHEN li.expires_at IS NOT NULL AND li.expires_at < NOW() THEN FALSE
      ELSE TRUE
    END AS is_valid,
    CASE 
      WHEN li.id IS NULL THEN 'Invalid license key'
      WHEN li.revoked THEN 'License has been revoked'
      WHEN li.expires_at IS NOT NULL AND li.expires_at < NOW() THEN 'License has expired'
      ELSE 'Valid'
    END AS reason,
    li.id AS license_id,
    li.tier,
    li.active_count::INTEGER AS active_devices,
    li.max_devices
  FROM license_info li;
END;
$$ LANGUAGE plpgsql;

-- Detect fraud patterns
CREATE OR REPLACE FUNCTION detect_license_fraud()
RETURNS TRIGGER AS $$
DECLARE
  device_count INTEGER;
  time_span INTERVAL;
  geo_spread NUMERIC;
BEGIN
  -- Check for rapid device switching
  SELECT 
    COUNT(DISTINCT device_id),
    MAX(activated_at) - MIN(activated_at)
  INTO device_count, time_span
  FROM license_activations
  WHERE license_id = NEW.license_id
    AND activated_at > NOW() - INTERVAL '24 hours';
  
  IF device_count > 5 AND time_span < INTERVAL '1 hour' THEN
    INSERT INTO license_fraud_events (
      license_id,
      event_type,
      severity,
      description,
      device_ids
    ) VALUES (
      NEW.license_id,
      'rapid_device_switching',
      'high',
      'Multiple devices activated in short time period',
      ARRAY(SELECT device_id FROM license_activations WHERE license_id = NEW.license_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER check_fraud_on_activation
  AFTER INSERT ON license_activations
  FOR EACH ROW
  EXECUTE FUNCTION detect_license_fraud();

-- Row Level Security
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotkey_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_usage ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own licenses"
  ON licenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activations"
  ON license_activations FOR SELECT
  USING (
    license_id IN (
      SELECT id FROM licenses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active hotkey packs"
  ON hotkey_packs FOR SELECT
  USING (is_active = TRUE);

-- Revenue sharing table
CREATE TABLE IF NOT EXISTS revenue_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  creator_share DECIMAL(5,4) DEFAULT 0.7000, -- 70%
  reseller_share DECIMAL(5,4) DEFAULT 0.0000, -- 0% if no reseller
  platform_share DECIMAL(5,4) DEFAULT 0.2000, -- 20%
  infrastructure_share DECIMAL(5,4) DEFAULT 0.1000, -- 10%
  
  -- Calculated amounts
  creator_amount DECIMAL(10, 2),
  reseller_amount DECIMAL(10, 2),
  platform_amount DECIMAL(10, 2),
  infrastructure_amount DECIMAL(10, 2),
  
  -- Payment status
  creator_paid BOOLEAN DEFAULT FALSE,
  reseller_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  INDEX idx_revenue_license_id (license_id),
  INDEX idx_revenue_creator_paid (creator_paid)
);

-- Creator analytics table
CREATE TABLE IF NOT EXISTS creator_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  
  -- Metrics
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0.00,
  total_installations INTEGER DEFAULT 0,
  active_licenses INTEGER DEFAULT 0,
  
  -- Popular hotkeys
  top_hotkey_id UUID REFERENCES hotkey_packs(id),
  top_hotkey_sales INTEGER DEFAULT 0,
  
  -- User feedback
  average_rating DECIMAL(3, 2),
  total_reviews INTEGER DEFAULT 0,
  
  -- AI agent specific metrics
  api_requests INTEGER DEFAULT 0,
  api_errors INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_analytics_creator_id (creator_id),
  INDEX idx_analytics_period (period_start, period_end),
  
  -- Unique constraint for creator per period
  UNIQUE(creator_id, period_start, period_end)
);

-- Installation attribution tracking
CREATE TABLE IF NOT EXISTS installation_attributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activation_id UUID REFERENCES license_activations(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id),
  creator_type user_role,
  hotkey_pack_id UUID REFERENCES hotkey_packs(id),
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Device and installation details
  device_id VARCHAR(255),
  installation_method VARCHAR(100), -- 'auto', 'manual', 'api'
  conflicts_resolved INTEGER DEFAULT 0,
  
  -- Attribution metadata
  attribution_comment TEXT, -- Added to config files
  source_info JSONB, -- API source, referral info, etc.
  
  -- Indexes
  INDEX idx_attribution_activation_id (activation_id),
  INDEX idx_attribution_creator_id (creator_id),
  INDEX idx_attribution_device_id (device_id)
);

-- Sample data
INSERT INTO hotkey_packs (name, description, category, price, hotkeys) VALUES
(
  'AI Productivity Pack',
  'Essential hotkeys for AI-powered coding productivity',
  'productivity',
  29.99,
  '[
    {
      "id": "ai-complete",
      "key": "ctrl+alt+space",
      "command": "ai.complete",
      "description": "Trigger AI code completion"
    },
    {
      "id": "ai-explain",
      "key": "ctrl+alt+e",
      "command": "ai.explain",
      "description": "Explain selected code"
    },
    {
      "id": "ai-refactor",
      "key": "ctrl+alt+r",
      "command": "ai.refactor",
      "description": "Refactor selected code"
    }
  ]'::jsonb
),
(
  'Testing Automation Pack',
  'Hotkeys for automated test generation and execution',
  'testing',
  39.99,
  '[
    {
      "id": "gen-test",
      "key": "ctrl+alt+t",
      "command": "ai.generateTest",
      "description": "Generate tests for selected code"
    },
    {
      "id": "run-test",
      "key": "ctrl+alt+shift+t",
      "command": "ai.runTest",
      "description": "Run test at cursor"
    }
  ]'::jsonb
);
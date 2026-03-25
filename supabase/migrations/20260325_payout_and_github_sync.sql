-- Payout persistence and GitHub installation sync tables

CREATE TABLE IF NOT EXISTS payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payout_method TEXT NOT NULL CHECK (payout_method IN ('manual')),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  transaction_count INTEGER NOT NULL CHECK (transaction_count > 0),
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  processed_by UUID REFERENCES users(id),
  confirmation_reference TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_batches_creator_id
  ON payout_batches(creator_id);
CREATE INDEX IF NOT EXISTS idx_payout_batches_created_at
  ON payout_batches(created_at DESC);

CREATE TABLE IF NOT EXISTS payout_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_batch_id UUID NOT NULL REFERENCES payout_batches(id) ON DELETE CASCADE,
  revenue_share_id UUID NOT NULL REFERENCES revenue_shares(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (payout_batch_id, revenue_share_id),
  UNIQUE (revenue_share_id)
);

CREATE INDEX IF NOT EXISTS idx_payout_batch_items_batch_id
  ON payout_batch_items(payout_batch_id);
CREATE INDEX IF NOT EXISTS idx_payout_batch_items_revenue_share_id
  ON payout_batch_items(revenue_share_id);

CREATE TABLE IF NOT EXISTS github_app_installations (
  installation_id BIGINT PRIMARY KEY,
  account_login TEXT,
  account_type TEXT,
  account_html_url TEXT,
  target_type TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  events TEXT[] NOT NULL DEFAULT '{}',
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_by TEXT,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_github_app_installations_account_login
  ON github_app_installations(account_login);

CREATE TABLE IF NOT EXISTS github_installation_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id BIGINT NOT NULL REFERENCES github_app_installations(installation_id) ON DELETE CASCADE,
  repository_id BIGINT NOT NULL,
  full_name TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  default_branch TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (installation_id, repository_id)
);

CREATE INDEX IF NOT EXISTS idx_github_installation_repositories_installation_id
  ON github_installation_repositories(installation_id);
CREATE INDEX IF NOT EXISTS idx_github_installation_repositories_repository_id
  ON github_installation_repositories(repository_id);

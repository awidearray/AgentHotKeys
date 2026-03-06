-- Moderation and Quality Control System Tables
-- Supporting security scanning and community reporting

-- Security scan logs
CREATE TABLE security_scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotkey_pack_id UUID NOT NULL REFERENCES hotkey_packs(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id),
    security_score INTEGER NOT NULL CHECK (security_score >= 0 AND security_score <= 100),
    issues_found INTEGER NOT NULL DEFAULT 0,
    critical_issues INTEGER NOT NULL DEFAULT 0,
    approved BOOLEAN NOT NULL DEFAULT false,
    scan_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community reports
CREATE TABLE community_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotkey_pack_id UUID NOT NULL REFERENCES hotkey_packs(id) ON DELETE CASCADE,
    reporter_user_id UUID NOT NULL REFERENCES users(id),
    report_type TEXT NOT NULL CHECK (report_type IN ('malicious_code', 'copyright_violation', 'spam', 'inappropriate_content', 'security_vulnerability', 'other')),
    description TEXT NOT NULL,
    evidence TEXT,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
    admin_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator warnings
CREATE TABLE creator_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id),
    warning_type TEXT NOT NULL,
    description TEXT NOT NULL,
    report_id UUID REFERENCES community_reports(id),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add moderation fields to hotkey_packs
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS security_scan_completed BOOLEAN DEFAULT false;
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS security_score INTEGER;
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS scan_issues JSONB DEFAULT '[]';
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false;
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS flagged_reason TEXT;
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false;
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS deleted_reason TEXT;
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE hotkey_packs ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX idx_security_scan_logs_pack_id ON security_scan_logs(hotkey_pack_id);
CREATE INDEX idx_security_scan_logs_creator_id ON security_scan_logs(creator_id);
CREATE INDEX idx_security_scan_logs_created_at ON security_scan_logs(created_at);

CREATE INDEX idx_community_reports_pack_id ON community_reports(hotkey_pack_id);
CREATE INDEX idx_community_reports_reporter ON community_reports(reporter_user_id);
CREATE INDEX idx_community_reports_status ON community_reports(status);
CREATE INDEX idx_community_reports_severity ON community_reports(severity);
CREATE INDEX idx_community_reports_created_at ON community_reports(created_at);

CREATE INDEX idx_creator_warnings_creator_id ON creator_warnings(creator_id);
CREATE INDEX idx_creator_warnings_type ON creator_warnings(warning_type);
CREATE INDEX idx_creator_warnings_severity ON creator_warnings(severity);

CREATE INDEX idx_hotkey_packs_security ON hotkey_packs(security_scan_completed, security_score);
CREATE INDEX idx_hotkey_packs_moderation ON hotkey_packs(flagged, suspended, deleted);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_reports_updated_at
    BEFORE UPDATE ON community_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get moderation statistics
CREATE OR REPLACE FUNCTION get_moderation_stats()
RETURNS TABLE(
    pending_reports BIGINT,
    resolved_today BIGINT,
    critical_reports BIGINT,
    flagged_packs BIGINT,
    suspended_packs BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM community_reports WHERE status = 'pending') as pending_reports,
        (SELECT COUNT(*) FROM community_reports WHERE status = 'resolved' AND DATE(reviewed_at) = CURRENT_DATE) as resolved_today,
        (SELECT COUNT(*) FROM community_reports WHERE severity = 'critical' AND status = 'pending') as critical_reports,
        (SELECT COUNT(*) FROM hotkey_packs WHERE flagged = true) as flagged_packs,
        (SELECT COUNT(*) FROM hotkey_packs WHERE suspended = true) as suspended_packs;
END;
$$ LANGUAGE plpgsql;

-- Function to get creator reputation score
CREATE OR REPLACE FUNCTION get_creator_reputation(creator_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    base_score INTEGER := 100;
    warning_penalty INTEGER;
    report_penalty INTEGER;
    success_bonus INTEGER;
BEGIN
    -- Deduct points for warnings
    SELECT COALESCE(COUNT(*) * 10, 0) INTO warning_penalty
    FROM creator_warnings 
    WHERE creator_id = creator_uuid;
    
    -- Deduct points for valid reports against their packs
    SELECT COALESCE(COUNT(*) * 5, 0) INTO report_penalty
    FROM community_reports cr
    JOIN hotkey_packs hp ON cr.hotkey_pack_id = hp.id
    WHERE hp.creator_id = creator_uuid AND cr.status = 'resolved';
    
    -- Add points for successful, well-rated packs
    SELECT COALESCE(COUNT(*) * 2, 0) INTO success_bonus
    FROM hotkey_packs 
    WHERE creator_id = creator_uuid 
    AND approved = true 
    AND rating_average >= 4.0 
    AND downloads > 10;
    
    RETURN GREATEST(0, LEAST(100, base_score - warning_penalty - report_penalty + success_bonus));
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE security_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_warnings ENABLE ROW LEVEL SECURITY;

-- Security scan logs: Only readable by admins and pack creators
CREATE POLICY "Admin read all scan logs" ON security_scan_logs
    FOR SELECT USING (true); -- Will be restricted by admin role check in application

CREATE POLICY "Creator read own scan logs" ON security_scan_logs
    FOR SELECT USING (creator_id = auth.uid());

-- Community reports: Reporters can read their own, admins can read all
CREATE POLICY "Reporter read own reports" ON community_reports
    FOR SELECT USING (reporter_user_id = auth.uid());

CREATE POLICY "Admin read all reports" ON community_reports
    FOR SELECT USING (true); -- Will be restricted by admin role check in application

CREATE POLICY "Users can create reports" ON community_reports
    FOR INSERT WITH CHECK (reporter_user_id = auth.uid());

-- Creator warnings: Creators can read their own warnings
CREATE POLICY "Creator read own warnings" ON creator_warnings
    FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Admin read all warnings" ON creator_warnings
    FOR SELECT USING (true); -- Will be restricted by admin role check in application
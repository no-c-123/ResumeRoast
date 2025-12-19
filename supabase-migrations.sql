CREATE TABLE IF NOT EXISTS resume_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resume_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resume_downloads_user_date 
ON resume_downloads(user_id, downloaded_at DESC);

ALTER TABLE resume_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own downloads"
    ON resume_downloads
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own downloads"
    ON resume_downloads
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'plan'
    ) THEN
        ALTER TABLE user_subscriptions ADD COLUMN plan TEXT DEFAULT 'free';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION get_user_plan(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_plan TEXT;
BEGIN
    SELECT plan INTO user_plan
    FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status IN ('active', 'trialing')
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(user_plan, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_download_limit(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    user_plan TEXT;
    downloads_this_month INTEGER;
    max_downloads INTEGER;
    result JSON;
BEGIN
    user_plan := get_user_plan(user_uuid);
    
    SELECT COUNT(*) INTO downloads_this_month
    FROM resume_downloads
    WHERE user_id = user_uuid
    AND DATE_TRUNC('month', downloaded_at) = DATE_TRUNC('month', NOW());
    
    CASE user_plan
        WHEN 'free' THEN max_downloads := 1;
        WHEN 'pro' THEN max_downloads := 999999;
        WHEN 'premium' THEN max_downloads := 999999;
        WHEN 'lifetime' THEN max_downloads := 999999;
        ELSE max_downloads := 1;
    END CASE;
    
    result := json_build_object(
        'can_download', downloads_this_month < max_downloads,
        'downloads_used', downloads_this_month,
        'downloads_remaining', GREATEST(0, max_downloads - downloads_this_month),
        'max_downloads', max_downloads,
        'plan', user_plan,
        'reset_date', (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT SELECT, INSERT ON resume_downloads TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_download_limit(UUID) TO authenticated;


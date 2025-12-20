-- Fix 1: Enable RLS on resume_templates
-- The error "RLS disabled in public" means the table exists but is insecure.
ALTER TABLE IF EXISTS public.resume_templates ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to read templates (assuming they are public assets)
-- If they are private per user, change USING (true) to USING (auth.uid() = user_id)
DROP POLICY IF EXISTS "Allow public read access" ON public.resume_templates;
CREATE POLICY "Allow public read access" ON public.resume_templates 
    FOR SELECT 
    USING (true);

-- Fix 2: Set search_path for functions
-- This fixes "Function Search Path Mutable" warnings by locking the search path to 'public'
-- preventing potential privilege escalation attacks.

-- Update get_user_plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_plan TEXT;
BEGIN
    SELECT plan INTO user_plan
    FROM public.user_subscriptions
    WHERE user_id = user_uuid
    AND status IN ('active', 'trialing')
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(user_plan, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update check_download_limit
CREATE OR REPLACE FUNCTION public.check_download_limit(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    user_plan TEXT;
    downloads_this_month INTEGER;
    max_downloads INTEGER;
    result JSON;
BEGIN
    -- Explicitly call get_user_plan from public schema
    user_plan := public.get_user_plan(user_uuid);
    
    SELECT COUNT(*) INTO downloads_this_month
    FROM public.resume_downloads
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update update_updated_at_column
-- This is a common trigger function that also needs the search_path fix
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

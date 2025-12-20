-- Enable RLS on user_subscriptions
ALTER TABLE IF EXISTS public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own subscription
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow service role (or specific flows) to manage subscriptions
-- (Implicitly service role bypasses RLS, but explicit policies might be needed if using authenticated client for updates)

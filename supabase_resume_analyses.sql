-- Create resume_analyses table
CREATE TABLE IF NOT EXISTS public.resume_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT,
    analysis_text TEXT,
    ats_score NUMERIC,
    suggestions JSONB,
    career_level TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id ON public.resume_analyses(user_id);

-- Enable Row Level Security
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own analyses
DROP POLICY IF EXISTS "Users can insert their own analyses" ON public.resume_analyses;
CREATE POLICY "Users can insert their own analyses"
    ON public.resume_analyses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own analyses
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.resume_analyses;
CREATE POLICY "Users can view their own analyses"
    ON public.resume_analyses
    FOR SELECT
    USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT ON public.resume_analyses TO authenticated;

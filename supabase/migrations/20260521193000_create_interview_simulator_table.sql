-- Migration: Create interview simulations table
-- Created at: 2026-05-21 19:30:00

CREATE TABLE IF NOT EXISTS public.interview_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    job_description TEXT,
    interviewer_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'started',
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    feedback JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS interview_simulations_user_id_idx ON public.interview_simulations(user_id);
CREATE INDEX IF NOT EXISTS interview_simulations_created_at_idx ON public.interview_simulations(created_at DESC);

-- Enable RLS
ALTER TABLE public.interview_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can select their own simulations"
    ON public.interview_simulations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own simulations"
    ON public.interview_simulations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulations"
    ON public.interview_simulations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simulations"
    ON public.interview_simulations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_interview_simulations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_interview_simulations_updated_at_trigger
    BEFORE UPDATE ON public.interview_simulations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_interview_simulations_updated_at();

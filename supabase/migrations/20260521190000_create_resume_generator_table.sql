CREATE TABLE IF NOT EXISTS public.generated_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    profile_data JSONB NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;

-- Select Policy
CREATE POLICY "Users can view their own generated resumes"
    ON public.generated_resumes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Insert Policy
CREATE POLICY "Users can insert their own generated resumes"
    ON public.generated_resumes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Update Policy
CREATE POLICY "Users can update their own generated resumes"
    ON public.generated_resumes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Delete Policy
CREATE POLICY "Users can delete their own generated resumes"
    ON public.generated_resumes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS generated_resumes_user_id_idx ON public.generated_resumes(user_id);

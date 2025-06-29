-- Add used_fallback column to curriculum_analysis table
ALTER TABLE public.curriculum_analysis 
ADD COLUMN IF NOT EXISTS used_fallback BOOLEAN DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN public.curriculum_analysis.used_fallback IS 'Indicates if the analysis was generated using fallback logic instead of OpenAI API'; 